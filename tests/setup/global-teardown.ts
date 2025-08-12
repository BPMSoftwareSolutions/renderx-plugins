/**
 * Jest Global Teardown
 * Runs once after all tests complete
 */

export default async function globalTeardown() {
  console.log('🎼 Cleaning up MusicalConductor test environment...');
  
  // Clean up any global resources
  // Reset environment variables
  delete process.env.JEST_WORKER_ID;
  
  // Clean up global mocks
  if ((global as any).fetch) {
    delete (global as any).fetch;
  }
  
  if ((global as any).URL) {
    delete (global as any).URL;
  }
  
  if ((global as any).window) {
    delete (global as any).window;
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  console.log('✅ MusicalConductor test environment cleaned up');
}
