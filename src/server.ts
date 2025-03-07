import inquirer from "inquirer";
import { pool, connectToDb } from "./connection.js";
// import { QueryResult } from "pg";

/** ✅ Initialize the CLI */
const startApp = async () => {
   // Ensure DB is connected before starting the server
  await connectToDb();
  console.log("\n📊 Welcome to the Employee Tracker CLI\n");
  mainMenu();
};

startApp();

/** ✅ Fetch all departments */
const fetchDepartments = async () => {
  try {
    const { rows } = await pool.query("SELECT * FROM department ORDER BY id ASC");
    console.table(rows);
  } catch (err) {
    console.error("❌ Error fetching departments:", err);
  }
};

/** ✅ Fetch all roles */
const fetchRoles = async () => {
  try {
    const { rows } = await pool.query(`
      SELECT role.id, role.title, role.salary, department.name AS department
      FROM role
      JOIN department ON role.department_id = department.id
      ORDER BY role.id ASC
    `);
    console.table(rows);
  } catch (err) {
    console.error("❌ Error fetching roles:", err);
  }
};

/** ✅ Fetch all employees */
const fetchEmployees = async () => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        e1.id, 
        e1.first_name, 
        e1.last_name, 
        role.title AS job_title, 
        department.name AS department, 
        role.salary, 
        CONCAT(e2.first_name, ' ', e2.last_name) AS manager
      FROM employee e1
      JOIN role ON e1.role_id = role.id
      JOIN department ON role.department_id = department.id
      LEFT JOIN employee e2 ON e1.manager_id = e2.id
      ORDER BY e1.id ASC
    `);
    console.table(rows);
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
  }
};

/** ✅ View employees by manager */
const viewEmployeesByManager = async () => {
  const { managerId } = await inquirer.prompt([
    { type: "input", name: "managerId", message: "Enter Manager ID to view their employees:", validate: input => !isNaN(parseInt(input)) }
  ]);
  try {
    const { rows } = await pool.query(`
      SELECT id, first_name, last_name, role_id FROM employee WHERE manager_id = $1 ORDER BY id ASC
    `, [parseInt(managerId)]);
    console.table(rows);
  } catch (err) {
    console.error("❌ Error fetching employees by manager:", err);
  }
};

/** ✅ View employees by department */
const viewEmployeesByDepartment = async () => {
  const { departmentId } = await inquirer.prompt([
    { type: "input", name: "departmentId", message: "Enter Department ID to view employees:", validate: input => !isNaN(parseInt(input)) }
  ]);
  try {
    const { rows } = await pool.query(`
      SELECT employee.id, employee.first_name, employee.last_name, role.title 
      FROM employee 
      JOIN role ON employee.role_id = role.id
      WHERE role.department_id = $1
      ORDER BY employee.id ASC
    `, [parseInt(departmentId)]);
    console.table(rows);
  } catch (err) {
    console.error("❌ Error fetching employees by department:", err);
  }
};

/** ✅ Update employee manager */
const updateEmployeeManager = async () => {
  const { employeeId, managerId } = await inquirer.prompt([
    { type: "input", name: "employeeId", message: "Enter Employee ID:", validate: input => !isNaN(parseInt(input)) },
    { type: "input", name: "managerId", message: "Enter New Manager ID (or press Enter for none):" }
  ]);
  try {
    await pool.query("UPDATE employee SET manager_id = $1 WHERE id = $2", [managerId ? parseInt(managerId) : null, parseInt(employeeId)]);
    console.log(`✅ Employee ID ${employeeId} manager updated successfully.`);
  } catch (err) {
    console.error("❌ Error updating employee manager:", err);
  }
};

/** ✅ Delete a department */
const deleteDepartment = async () => {
  const { departmentId } = await inquirer.prompt([
    { type: "input", name: "departmentId", message: "Enter Department ID to delete:", validate: input => !isNaN(parseInt(input)) }
  ]);
  try {
    await pool.query("DELETE FROM department WHERE id = $1", [parseInt(departmentId)]);
    console.log(`✅ Department ID ${departmentId} deleted successfully.`);
  } catch (err) {
    console.error("❌ Error deleting department:", err);
  }
};

/** ✅ Delete a role */
const deleteRole = async () => {
  const { roleId } = await inquirer.prompt([
    { type: "input", name: "roleId", message: "Enter Role ID to delete:", validate: input => !isNaN(parseInt(input)) }
  ]);
  try {
    await pool.query("DELETE FROM role WHERE id = $1", [parseInt(roleId)]);
    console.log(`✅ Role ID ${roleId} deleted successfully.`);
  } catch (err) {
    console.error("❌ Error deleting role:", err);
  }
};

/** ✅ Delete an employee */
const deleteEmployee = async () => {
  const { employeeId } = await inquirer.prompt([
    { type: "input", name: "employeeId", message: "Enter Employee ID to delete:", validate: input => !isNaN(parseInt(input)) }
  ]);
  try {
    await pool.query("DELETE FROM employee WHERE id = $1", [parseInt(employeeId)]);
    console.log(`✅ Employee ID ${employeeId} deleted successfully.`);
  } catch (err) {
    console.error("❌ Error deleting employee:", err);
  }
};

/** ✅ Main Menu */
const mainMenu = async () => {
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "📌 What would you like to do?",
        choices: [
          "📂 View all departments",
          "📝 View all roles",
          "👥 View all employees",
          "👨‍💼 View employees by manager",
          "🏢 View employees by department",
          "➕ Add a department",
          "➕ Add a role",
          "➕ Add an employee",
          "✏️ Update an employee role",
          "👨‍💼 Update an employee manager",
          "🗑️ Delete a department",
          "🗑️ Delete a role",
          "🗑️ Delete an employee",
          "🚪 Quit",
        ],
      },
    ]);

    switch (action) {
      case "📂 View all departments": await fetchDepartments(); break;
      case "📝 View all roles": await fetchRoles(); break;
      case "👥 View all employees": await fetchEmployees(); break;
      case "👨‍💼 View employees by manager": await viewEmployeesByManager(); break;
      case "🏢 View employees by department": await viewEmployeesByDepartment(); break;
      case "➕ Add a department":
      const { deptName } = await inquirer.prompt([
      {
      type: "input",
      name: "deptName",
      message: "Enter the name of the new department:",
      validate: (input) => input ? true : "Department name cannot be empty.",
      },
     ]);
     await addDepartment(deptName);
     break;
     case "➕ Add a role":
     const { roleName, roleSalary, roleDeptId } = await inquirer.prompt([
      {
        type: "input",
        name: "roleName",
        message: "Enter the name of the new role:",
        validate: (input) => input ? true : "Role name cannot be empty.",
      },
      {
        type: "input",
        name: "roleSalary",
        message: "Enter the salary for this role:",
        validate: (input) => isNaN(parseFloat(input)) ? "Enter a valid salary." : true,
      },
      {
        type: "input",
        name: "roleDeptId",
        message: "Enter the department ID for this role:",
        validate: (input) => isNaN(parseInt(input)) ? "Enter a valid department ID." : true,
       },
      ]);
      await addRole(roleName, parseFloat(roleSalary), parseInt(roleDeptId));
      break;
  
      case "➕ Add an employee":
      const { firstName, lastName, employeeRoleId, employeeManagerId } = await inquirer.prompt([
        {
          type: "input",
          name: "firstName",
          message: "Enter the employee's first name:",
          validate: (input) => input ? true : "First name cannot be empty.",
        },
        {
          type: "input",
          name: "lastName",
          message: "Enter the employee's last name:",
          validate: (input) => input ? true : "Last name cannot be empty.",
        },
        {
          type: "input",
          name: "employeeRoleId",
          message: "Enter the role ID for this employee:",
          validate: (input) => isNaN(parseInt(input)) ? "Enter a valid role ID." : true,
        },
        {
          type: "input",
          name: "employeeManagerId",
          message: "Enter the manager ID (or press Enter for none):",
        },
      ]);
      await addEmployee(firstName, lastName, parseInt(employeeRoleId), employeeManagerId ? parseInt(employeeManagerId) : null);
      break;
    
      case "✏️ Update an employee role": await updateEmployeeManager(); break;
      case "👨‍💼 Update an employee manager": await updateEmployeeManager(); break;
      case "🗑️ Delete a department": await deleteDepartment(); break;
      case "🗑️ Delete a role": await deleteRole(); break;
      case "🗑️ Delete an employee": await deleteEmployee(); break;
      case "🚪 Quit": console.log("👋 Goodbye!"); process.exit(0);
    }
  }
};

const addDepartment = async (name: string) => {
  try {
    await pool.query("INSERT INTO department (name) VALUES ($1)", [name]);
    console.log(`✅ Department '${name}' added successfully.`);
  } catch (err) {
    console.error("❌ Error adding department:", err);
  }
};

const addRole = async (title: string, salary: number, department_id: number) => {
  try {
    await pool.query(
      "INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)",
      [title, salary, department_id]
    );
    console.log(`✅ Role '${title}' added successfully.`);
  } catch (err) {
    console.error("❌ Error adding role:", err);
  }
};

const addEmployee = async (first_name: string, last_name: string, role_id: number, manager_id: number | null) => {
  try {
    await pool.query(
      "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)",
      [first_name, last_name, role_id, manager_id]
    );
    console.log(`✅ Employee '${first_name} ${last_name}' added successfully.`);
  } catch (err) {
    console.error("❌ Error adding employee:", err);
  }
};

