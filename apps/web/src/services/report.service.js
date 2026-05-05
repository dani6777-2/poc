import api from "../api/client";

export const reportService = {
  downloadMonthlyPdf: async (month) => {
    const response = await api.get(`/reports/${month}/pdf`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reporte-${month}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};