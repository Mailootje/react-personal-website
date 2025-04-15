#!/usr/bin/env node
// Script to directly create an admin user with default credentials

import fetch from 'node-fetch';

async function createAdmin() {
  const username = "admin";
  const password = "admin123";
  const email = "admin@example.com";

  console.log("\n===== Creating Default Admin User =====\n");
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  console.log(`Email: ${email}`);

  try {
    const response = await fetch("http://localhost:5000/api/setup-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        email,
        isAdmin: true
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
}

createAdmin();