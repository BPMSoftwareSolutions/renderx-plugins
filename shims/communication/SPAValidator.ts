export class SPAValidator {
  constructor(private config: any = {}) {}
  generateViolationReport() {
    return { violationsBySeverity: { info: 0, warn: 0, error: 0 } };
  }
  disableRuntimeChecks() {}
}

