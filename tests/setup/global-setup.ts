/**
 * Jest Global Setup
 * Runs once before all tests start
 */

export default async function globalSetup() {
  console.log("🎼 Setting up MusicalConductor test environment...");

  // Set up global test environment variables
  process.env.NODE_ENV = "test";
  process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || "1";

  // Mock browser APIs that might be needed
  if (typeof window === "undefined") {
    // Mock window object for Node.js environment
    (global as any).window = {
      location: { href: "http://localhost:3000" },
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    };

    // Mock fetch for plugin loading tests
    (global as any).fetch = () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(""),
      });

    // Mock URL for blob URL creation
    (global as any).URL = {
      createObjectURL: () => "blob:mock-url",
      revokeObjectURL: () => {},
    };
  }

  // Initialize test database or external services if needed
  // (Currently not needed for MusicalConductor)

  console.log("✅ MusicalConductor test environment ready");
}
