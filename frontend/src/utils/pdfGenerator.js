import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Génère un PDF de rapport professionnel
 * @param {object} data - Données du rapport (venant de l'API)
 * @param {string} type - "journalier" | "hebdomadaire" | "mensuel"
 */
export function genererPDF(data, type = "journalier") {
  const doc = new jsPDF("p", "mm", "a4");
  const largeur = doc.internal.pageSize.getWidth();
  const hauteur = doc.internal.pageSize.getHeight();

  const nomCyber = data.parametres?.nom_cyber || "Cyber Famille";
  const adresse = data.parametres?.adresse || "";
  const telephone = data.parametres?.telephone || "";
  const devise = data.parametres?.devise || "Ar";

  // ==========================================
  // EN-TÊTE
  // ==========================================
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, largeur, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(nomCyber, largeur / 2, 15, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const ligneAdresse = [adresse, telephone].filter(Boolean).join(" · ");
  if (ligneAdresse) {
    doc.text(ligneAdresse, largeur / 2, 22, { align: "center" });
  }

  // ==========================================
  // TITRE DU RAPPORT
  // ==========================================
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");

  let titre = "Rapport Journalier";
  if (type === "hebdomadaire") titre = "Rapport Hebdomadaire";
  if (type === "mensuel") titre = "Rapport Mensuel";

  doc.text(titre, largeur / 2, 50, { align: "center" });

  // Période
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);

  const debut = new Date(data.periode.debut).toLocaleDateString("fr-FR");
  const fin = new Date(data.periode.fin).toLocaleDateString("fr-FR");
  const periodeTexte =
    data.periode.debut === data.periode.fin
      ? `Le ${debut}`
      : `Du ${debut} au ${fin}`;
  doc.text(periodeTexte, largeur / 2, 57, { align: "center" });

  // ==========================================
  // TOTAUX (encadré)
  // ==========================================
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, 65, largeur - 30, 25, 3, 3, "F");

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RÉSUMÉ", 20, 73);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Recette totale : ${Number(data.totaux.total).toLocaleString("fr-FR")} ${devise}`,
    20,
    81
  );
  doc.text(`Tickets vendus : ${data.totaux.nb_tickets}`, 20, 86);

  doc.text(
    `Ventes : ${data.totaux.nb_ventes}`,
    largeur / 2 + 10,
    81
  );
  doc.text(`Période : ${periodeTexte}`, largeur / 2 + 10, 86);

  // ==========================================
  // RÉPARTITION PAR FORFAIT
  // ==========================================
  let y = 100;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("Répartition par forfait", 15, y);
  doc.setTextColor(0, 0, 0);

  y += 5;
  autoTable(doc, {
    startY: y,
    head: [["Forfait", "Durée", "Prix unitaire", "Quantité", "Total"]],
    body: data.par_forfait.map((f) => [
      f.forfait,
      `${f.duree_minutes} min`,
      `${Number(f.prix).toLocaleString("fr-FR")} ${devise}`,
      f.nb_ventes,
      `${Number(f.total).toLocaleString("fr-FR")} ${devise}`,
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      3: { halign: "center" },
      4: { halign: "right", fontStyle: "bold" },
    },
  });

  // ==========================================
  // RÉPARTITION PAR CAISSIER
  // ==========================================
  y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 211, 238);
  doc.text("Répartition par caissier", 15, y);
  doc.setTextColor(0, 0, 0);

  y += 5;
  autoTable(doc, {
    startY: y,
    head: [["Caissier", "Nombre de ventes", "Total encaissé"]],
    body: data.par_caissier.map((c) => [
      c.caissier,
      c.nb_ventes,
      `${Number(c.total).toLocaleString("fr-FR")} ${devise}`,
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [34, 211, 238],
      textColor: 0,
      fontStyle: "bold",
    },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right", fontStyle: "bold" },
    },
  });

  // ==========================================
  // TOP CLIENTS (si présents)
  // ==========================================
  if (data.top_clients && data.top_clients.length > 0) {
    y = doc.lastAutoTable.finalY + 10;

    // Nouvelle page si trop bas
    if (y > hauteur - 60) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94);
    doc.text("Top 5 clients", 15, y);
    doc.setTextColor(0, 0, 0);

    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Client", "Téléphone", "Achats", "Total dépensé"]],
      body: data.top_clients.map((c) => [
        c.nom_client || "—",
        c.telephone_client || "—",
        c.nb_achats,
        `${Number(c.total).toLocaleString("fr-FR")} ${devise}`,
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        2: { halign: "center" },
        3: { halign: "right", fontStyle: "bold" },
      },
    });
  }

  // ==========================================
  // DÉTAIL DES VENTES
  // ==========================================
  y = doc.lastAutoTable.finalY + 10;

  if (y > hauteur - 60) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(250, 204, 21);
  doc.text("Détail des ventes", 15, y);
  doc.setTextColor(0, 0, 0);

  y += 5;
  autoTable(doc, {
    startY: y,
    head: [["Date", "Code", "Forfait", "Caissier", "Montant"]],
    body: data.details.map((d) => [
      new Date(d.date_vente).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      d.code,
      d.forfait,
      d.caissier,
      `${Number(d.montant).toLocaleString("fr-FR")} ${devise}`,
    ]),
    theme: "striped",
    headStyles: {
      fillColor: [250, 204, 21],
      textColor: 0,
      fontStyle: "bold",
    },
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: {
      4: { halign: "right", fontStyle: "bold" },
    },
    foot: [
      [
        { content: "TOTAL", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
        {
          content: `${Number(data.totaux.total).toLocaleString("fr-FR")} ${devise}`,
          styles: { halign: "right", fontStyle: "bold", textColor: [249, 115, 22] },
        },
      ],
    ],
    footStyles: {
      fillColor: [245, 245, 245],
      textColor: 0,
    },
  });

  // ==========================================
  // PIED DE PAGE
  // ==========================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Généré le ${new Date(data.genere_le).toLocaleString("fr-FR")}`,
      15,
      hauteur - 10
    );
    doc.text(
      `Page ${i} / ${totalPages}`,
      largeur - 15,
      hauteur - 10,
      { align: "right" }
    );
    doc.text(
      nomCyber,
      largeur / 2,
      hauteur - 10,
      { align: "center" }
    );
  }

  // ==========================================
  // SAUVEGARDE
  // ==========================================
  const dateStr = data.periode.debut === data.periode.fin
    ? data.periode.debut
    : `${data.periode.debut}_${data.periode.fin}`;

  doc.save(`rapport_${type}_${dateStr}.pdf`);
}