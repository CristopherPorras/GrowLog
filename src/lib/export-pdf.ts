import { jsPDF } from "jspdf";
import type { Project } from "./store";

export function exportProjectPdf(project: Project) {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${project.emoji} ${project.name}`, margin, y);
  y += 10;

  // Stats
  const uniqueDays = new Set(project.entries.map((e) => e.date.slice(0, 10))).size;
  const progress = Math.min(100, Math.round((uniqueDays / project.goalDays) * 100));
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Progreso: ${progress}% (${uniqueDays}/${project.goalDays} días)`, margin, y);
  y += 8;
  doc.text(`Generado el ${new Date().toLocaleDateString("es-ES")}`, margin, y);
  y += 12;

  // Divider
  doc.setDrawColor(200);
  doc.line(margin, y, 190, y);
  y += 10;

  // Entries
  const sorted = [...project.entries].sort((a, b) => a.date.localeCompare(b.date));
  doc.setTextColor(30);

  sorted.forEach((entry) => {
    if (y > 270) {
      doc.addPage();
      y = margin;
    }

    const dateStr = new Date(entry.date).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94); // success green
    doc.text(`✓ ${dateStr}`, margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30);
    doc.setFontSize(9);

    // Wrap text
    const lines = doc.splitTextToSize(entry.text, 170);
    lines.forEach((line: string) => {
      if (y > 275) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    });

    y += 6;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("DevLog & Learn — Prueba de aprendizaje verificada", margin, 290);

  doc.save(`devlog-${project.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
