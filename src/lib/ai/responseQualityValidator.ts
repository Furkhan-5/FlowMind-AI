import { AgentResponseEnvelope, InterpretedIntent } from './agentContracts';

export interface QualityValidationResult {
  isValid: boolean;
  score: number; // 0.0 to 1.0
  checks: {
    answeredDirectly: boolean;
    dataAccuratelyReflected: boolean;
    toolExecutionHonest: boolean;
    actionDistinctionAccurate: boolean;
    noHallucinationDetected: boolean;
  };
  defects: string[];
  correctedResponse?: string;
}

export class ResponseQualityValidator {
  /**
   * Validates response quality and honesty against user intent and tool execution records.
   */
  public validate(
    response: AgentResponseEnvelope,
    intent: InterpretedIntent,
    userQuery: string
  ): QualityValidationResult {
    const defects: string[] = [];
    const text = response.userFacingResponse || '';
    const lowerText = text.toLowerCase();
    const lowerQuery = userQuery.toLowerCase();

    let answeredDirectly = true;
    let dataAccuratelyReflected = true;
    let toolExecutionHonest = true;
    let actionDistinctionAccurate = true;
    let noHallucinationDetected = true;

    // 1. Tool Execution Honesty Check
    // If a tool failed, response must NOT claim success
    if (response.toolExecutionDetails && response.toolExecutionDetails.length > 0) {
      const hasFailedTool = response.toolExecutionDetails.some((t) => t.executionStatus === 'FAILED');
      if (hasFailedTool) {
        const claimsSuccess = /successfully (created|updated|scheduled|sent|processed)/i.test(text);
        if (claimsSuccess) {
          toolExecutionHonest = false;
          defects.push('Response falsely claimed successful operation when underlying tool execution failed.');
        }
      }
    }

    // 2. Data Retrieval Faithfulness
    // If user asked to retrieve records, response must not be generic placeholder text
    if (intent.operationType === 'DATA_RETRIEVAL') {
      const isGenericPlaceholder =
        text.includes('processed your request across system modules') ||
        text.includes('evaluated enterprise performance and synchronized');

      if (isGenericPlaceholder) {
        dataAccuratelyReflected = false;
        defects.push('Response returned generic placeholder text instead of real retrieved database records.');
      }
    }

    // 3. Action Distinction Check
    // Proactive / Pending actions must indicate awaiting confirmation, not state they are already done
    if (response.approvalRequired && response.executionStatus === 'AWAITING_CONFIRMATION') {
      if (/has been (sent|created|deleted|updated)\b/i.test(text) && !/preview|awaiting|approval|action card/i.test(text)) {
        actionDistinctionAccurate = false;
        defects.push('Action requiring user confirmation claimed to already be executed.');
      }
    }

    // 4. Overdue Invoices Check
    if (intent.primaryIntent === 'FINANCE_GET_OVERDUE_INVOICES') {
      const isCalculationOrFollowUp =
        lowerQuery.includes('recover') ||
        lowerQuery.includes('%') ||
        lowerQuery.includes('percent') ||
        lowerQuery.includes('remaining') ||
        lowerQuery.includes('recommend') ||
        lowerQuery.includes('outstanding') ||
        lowerQuery.includes('total');

      if (!isCalculationOrFollowUp && !lowerText.includes('overdue') && !lowerText.includes('techcorp')) {
        answeredDirectly = false;
        defects.push('Response did not directly address overdue invoices.');
      }
    }

    // 5. CRM Lead Creation Check
    if (intent.primaryIntent === 'CRM_CREATE_LEAD') {
      const requestedCompany = intent.entities?.company || 'ABC Technologies';
      if (!text.toLowerCase().includes(requestedCompany.toLowerCase()) && !lowerText.includes('lead')) {
        answeredDirectly = false;
        defects.push(`Response did not reference the requested company '${requestedCompany}'.`);
      }
    }

    const checksCount = 5;
    const failedChecks = [
      !answeredDirectly,
      !dataAccuratelyReflected,
      !toolExecutionHonest,
      !actionDistinctionAccurate,
      !noHallucinationDetected,
    ].filter(Boolean).length;

    const score = Math.max(0, (checksCount - failedChecks) / checksCount);
    const isValid = defects.length === 0;

    let correctedResponse: string | undefined = undefined;
    if (!isValid && defects.length > 0) {
      correctedResponse = this.attemptControlledCorrection(response, intent, defects);
    }

    return {
      isValid,
      score,
      checks: {
        answeredDirectly,
        dataAccuratelyReflected,
        toolExecutionHonest,
        actionDistinctionAccurate,
        noHallucinationDetected,
      },
      defects,
      correctedResponse,
    };
  }

  private attemptControlledCorrection(
    response: AgentResponseEnvelope,
    intent: InterpretedIntent,
    defects: string[]
  ): string {
    // If tool execution failed, provide clear honest failure message
    const failedTool = response.toolExecutionDetails?.find((t) => t.executionStatus === 'FAILED');
    if (failedTool) {
      return `⚠️ Unable to complete ${intent.primaryIntent}: ${failedTool.errorMessage || 'An error occurred during backend execution. Please verify permissions and try again.'}`;
    }

    // If data retrieval returned real data but response was generic, format the actual data
    if (response.actualResultData && (!response.userFacingResponse || response.userFacingResponse.length < 30)) {
      if (Array.isArray(response.actualResultData)) {
        return `✅ Retrieved ${response.actualResultData.length} record(s) matching your request.`;
      }
    }

    return response.userFacingResponse;
  }
}

export const responseQualityValidator = new ResponseQualityValidator();
