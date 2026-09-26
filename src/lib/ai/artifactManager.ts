import { AgentType } from '@/types';
import { ArtifactRef, ArtifactType } from '@/types/universalAgent';
import { downloadInvoiceFile, generateInvoiceHTML } from '@/lib/utils/invoiceGenerator';

export class ArtifactManagerService {
  public createArtifact(
    type: ArtifactType,
    title: string,
    sourceAgent: AgentType,
    data: Record<string, any>
  ): ArtifactRef {
    const id = `ART-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timeStr = new Date().toISOString();

    let downloadFilename = `FlowMind_${sourceAgent}_${type}_${id}.html`;
    if (type === 'INVOICE') {
      const invNum = data.invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      downloadFilename = `FlowMind_Invoice_${invNum}.html`;
    } else if (type === 'CSV') {
      downloadFilename = `FlowMind_${sourceAgent}_Data_${id}.csv`;
    } else if (type === 'JSON') {
      downloadFilename = `FlowMind_${sourceAgent}_Export_${id}.json`;
    }

    return {
      id,
      title,
      type,
      sourceAgent,
      createdAt: timeStr,
      downloadFilename,
      data,
    };
  }

  public downloadArtifact(artifact: ArtifactRef): void {
    if (artifact.type === 'INVOICE') {
      downloadInvoiceFile({
        invoiceNumber: artifact.data?.invoiceNumber,
        clientName: artifact.data?.client || artifact.data?.clientName || 'Valued Client',
        amount: artifact.data?.amount || '₹50,000',
        tax: artifact.data?.tax || '₹9,000 (18% GST)',
        service: artifact.data?.service || artifact.title,
        status: artifact.data?.status || 'APPROVED',
      });
      return;
    }

    let fileContent = '';
    let mimeType = 'text/html;charset=utf-8';

    if (artifact.type === 'CSV') {
      mimeType = 'text/csv;charset=utf-8';
      fileContent = this.generateCSVContent(artifact.data);
    } else if (artifact.type === 'JSON') {
      mimeType = 'application/json;charset=utf-8';
      fileContent = JSON.stringify(artifact.data || {}, null, 2);
    } else {
      fileContent = this.generateReportHTML(artifact);
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = artifact.downloadFilename || `FlowMind_${artifact.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private generateCSVContent(data: Record<string, any>): string {
    if (!data) return 'Metric,Value\nData,Empty';
    const rows = ['Metric,Value'];
    Object.entries(data).forEach(([k, v]) => {
      rows.push(`"${k}","${String(v).replace(/"/g, '""')}"`);
    });
    return rows.join('\n');
  }

  private generateReportHTML(artifact: ArtifactRef): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${artifact.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
    .card { background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid #334155; max-width: 700px; margin: 0 auto; }
    h1 { color: #c084fc; font-size: 22px; margin-bottom: 8px; }
    .meta { font-size: 12px; color: #94a3b8; margin-bottom: 20px; border-bottom: 1px solid #334155; padding-bottom: 12px; }
    pre { background: #090d16; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; color: #a7f3d0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚡ FlowMind AI Enterprise Artifact</h1>
    <div class="meta">Title: <strong>${artifact.title}</strong> | Source Agent: <strong>${artifact.sourceAgent} Agent</strong></div>
    <h3>Exported Parameters & Data Payload:</h3>
    <pre>${JSON.stringify(artifact.data || {}, null, 2)}</pre>
  </div>
</body>
</html>`;
  }
}

export const artifactManager = new ArtifactManagerService();
