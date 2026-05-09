import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToExcel = (tasks, filename = 'tasks.xlsx') => {
  const data = tasks.map(t => ({
    'Subject': t.briefSubject || '',
    'Letter No': t.letterNo,
    'Source Dept': t.sourceDept,
    'Letter Date': t.letterDate,
    'Received Date & Time': t.receivedDateTime,
    'Assigned By': t.assignedBySenior,
    'Priority': t.priority,
    'Instructions': t.instructions,
    'Assigned To': Array.isArray(t.assignedTo) ? t.assignedTo.join(', ') : t.assignedTo,
    'Assignment Date & Time': t.assignmentDateTime,
    'Tentative Completion Time': t.tentativeCompletionTime,
    'Incharge Remarks': t.inchargeRemarks,
    'Global Status': t.status,
    'Subordinate Statuses': t.subordinateStatuses ? Object.entries(t.subordinateStatuses).map(([k,v]) => `${k}: ${v.status}`).join(' | ') : ''
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
  XLSX.writeFile(workbook, filename);
};

export const exportToPDF = async (elementId, filename = 'tasks.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
};
