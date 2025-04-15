#!/usr/bin/env node
// Script to set up an initial admin user for the blog

import readline from 'readline';
import fetch from 'node-fetch';

async function setupAdmin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("\n===== Blog Admin Setup =====\n");
  console.log("This script will create an initial admin user for the blog system.");
  console.log("This should only be run once when setting up the application.\n");

  const username = await new Promise((resolve) => {
    rl.question("Enter admin username: ", (answer) => {
      resolve(answer.trim());
    });
  });

  if (!username) {
    console.error("Username cannot be empty.");
    rl.close();
    return;
  }

  const password = await new Promise((resolve) => {
    rl.question("Enter admin password (min 6 characters): ", (answer) => {
      resolve(answer.trim());
    });
  });

  if (!password || password.length < 6) {
    console.error("Password must be at least 6 characters.");
    rl.close();
    return;
  }

  const email = await new Promise((resolve) => {
    rl.question("Enter admin email (optional): ", (answer) => {
      resolve(answer.trim());
    });
  });

  console.log("\nSetting up admin user...");

  try {
    const response = await fetch("http://localhost:5000/api/setup-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        email: email || null
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("\n✓ Admin user created successfully!");
    console.log(`Username: ${data.username}`);
    console.log(`Admin status: ${data.isAdmin ? "Yes" : "No"}`);
    console.log("\nYou can now log in at /auth with these credentials.");
  } catch (error) {
    console.error("\n✗ Error creating admin user:");
    console.error(error.message);
    console.error("\nMake sure the server is running on port 5000.");
  }

  rl.close();
}

setupAdmin();