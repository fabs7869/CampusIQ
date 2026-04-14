import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportUsersToPDF = (users: any[]) => {
  const doc = new jsPDF();
  
  // 1. Branding Header
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CAMPU SIQ", 15, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Institutional Administrative Report: Strategic User Directory", 15, 28);
  
  // 2. Audit Details
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  const date = new Date().toLocaleString();
  doc.text(`Generated on: ${date}`, 150, 20);
  doc.text(`Total Records: ${users.length}`, 150, 28);

  // 3. Table Headers and Data
  const headers = [["#", "Full Name", "Institutional Email", "Role", "Status", "Password"]];
  const data = users.map((u, i) => [
    i + 1,
    u.full_name,
    u.email,
    u.role.toUpperCase(),
    u.is_active ? "ACTIVE" : "DISABLED",
    u.plain_password || "LEGACY_SECURED"
  ]);

  // 4. AutoTable Configuration
  autoTable(doc, {
    startY: 50,
    head: headers,
    body: data,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 4
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate-50
    },
    margin: { top: 50, left: 15, right: 15 },
    didDrawPage: (data: any) => {
      // Footer
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} | CampusIQ Audit System`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
    }
  });

  // 5. Save the PDF
  const fileName = `CampusIQ_UserDirectory_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const exportAuditToPDF = (stats: any[]) => {
  const doc = new jsPDF() as any;
  
  // 1. Branding Header
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("INSTITUTIONAL AUDIT", 15, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Strategic Efficiency Report: Departmental Resolution Metrics", 15, 28);
  
  // 2. Metadata
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  const date = new Date().toLocaleString();
  doc.text(`Audit Date: ${date}`, 150, 20);

  // 3. Table Headers and Data
  const headers = [["Department", "Resolved", "In Progress", "Efficiency %"]];
  const data = stats.map(s => [
    s.department_name,
    s.resolved,
    s.pending,
    `${Math.round((s.resolved/(s.resolved+s.pending)*100)) || 0}%`
  ]);

  // 4. AutoTable Configuration
  autoTable(doc, {
    startY: 50,
    head: headers,
    body: data,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // Blue-600
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: { fontSize: 9, cellPadding: 5 }
  });

  const fileName = `CampusIQ_AuditLog_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
