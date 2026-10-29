import React from 'react';
import { X, Printer, Download, CheckCircle, Store } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InvoiceModal = ({ sale, isOpen, onClose }) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('SUPERMART HYPERMARKET', 105, 18, { align: 'center' });

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Main High Street, Sector 14, Gurugram, HR - 122001', 105, 24, { align: 'center' });
      doc.text('GSTIN: 06AAAAA0000A1Z5 | Ph: +91 98765 43210', 105, 29, { align: 'center' });
      doc.line(14, 33, 196, 33);

      // Invoice info
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Invoice No: ${sale.invoiceNumber}`, 14, 40);
      doc.text(`Date: ${new Date(sale.saleDate).toLocaleString()}`, 14, 46);
      doc.text(`Cashier: ${sale.cashierName || 'Terminal 01'}`, 14, 52);

      doc.text(`Customer: ${sale.customerName || 'Walk-in'}`, 130, 40);
      if (sale.customerPhone) {
        doc.text(`Phone: ${sale.customerPhone}`, 130, 46);
      }
      doc.text(`Payment: ${sale.paymentMethod}`, 130, 52);

      // Line items table
      const tableData = (sale.items || []).map((item, index) => [
        index + 1,
        item.productName,
        item.quantity,
        `Rs. ${Number(item.unitPrice).toFixed(2)}`,
        `${item.taxRate}%`,
        `Rs. ${Number(item.discountAmount || 0).toFixed(2)}`,
        `Rs. ${Number(item.totalPrice).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 58,
        head: [['#', 'Item Description', 'Qty', 'Rate', 'GST', 'Disc', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8.5 },
      });

      const finalY = doc.lastAutoTable.finalY || 130;

      // Summary
      doc.setFontSize(9);
      doc.text(`Subtotal: Rs. ${Number(sale.subtotal).toFixed(2)}`, 140, finalY + 8);
      doc.text(`Tax (GST): Rs. ${Number(sale.taxAmount).toFixed(2)}`, 140, finalY + 14);
      doc.text(`Discount: Rs. ${Number(sale.discountAmount).toFixed(2)}`, 140, finalY + 20);

      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text(`Grand Total: Rs. ${Number(sale.totalAmount).toFixed(2)}`, 140, finalY + 28);

      if (sale.paymentMethod === 'CASH' && sale.amountTendered) {
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`Tendered: Rs. ${Number(sale.amountTendered).toFixed(2)}`, 140, finalY + 34);
        doc.text(`Change: Rs. ${Number(sale.changeAmount || 0).toFixed(2)}`, 140, finalY + 39);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Thank you for shopping at SuperMart! Items once sold can be returned within 7 days.', 105, finalY + 48, { align: 'center' });

      doc.save(`Invoice_${sale.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Controls Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold">Tax Invoice Generated</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print (Ctrl+P)</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>PDF Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-8 font-sans bg-white text-slate-900">
          {/* Header */}
          <div className="text-center pb-5 border-b border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <Store className="w-6 h-6" />
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">SuperMart Retail</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Main High Street, Sector 14, Gurugram, Haryana - 122001</p>
            <p className="text-[11px] text-slate-500">GSTIN: 06AAAAA0000A1Z5 | FSSAI Lic: 10819005000123</p>
            <p className="text-[11px] text-slate-500 font-medium">Customer Support: +91 98765 43210</p>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-dashed border-slate-300 text-xs">
            <div>
              <p><span className="text-slate-500">Invoice No:</span> <strong className="text-slate-900">{sale.invoiceNumber}</strong></p>
              <p className="mt-0.5"><span className="text-slate-500">Date & Time:</span> {new Date(sale.saleDate).toLocaleString()}</p>
              <p className="mt-0.5"><span className="text-slate-500">Cashier:</span> {sale.cashierName || 'Operator'}</p>
            </div>
            <div className="text-right">
              <p><span className="text-slate-500">Customer:</span> <strong className="text-slate-900">{sale.customerName || 'Walk-in Customer'}</strong></p>
              {sale.customerPhone && <p className="mt-0.5"><span className="text-slate-500">Phone:</span> {sale.customerPhone}</p>}
              <p className="mt-0.5"><span className="text-slate-500">Payment:</span> <span className="font-semibold uppercase">{sale.paymentMethod}</span> ({sale.paymentStatus})</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2">#</th>
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">GST</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items?.map((item, idx) => (
                  <tr key={idx} className="py-1.5">
                    <td className="py-2 text-slate-400">{idx + 1}</td>
                    <td className="py-2 font-medium text-slate-800">
                      <div>{item.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.productSku}</div>
                    </td>
                    <td className="py-2 text-center font-semibold">{item.quantity}</td>
                    <td className="py-2 text-right text-slate-600">₹{Number(item.unitPrice).toFixed(2)}</td>
                    <td className="py-2 text-right text-slate-500">{item.taxRate}%</td>
                    <td className="py-2 text-right font-bold text-slate-900">₹{Number(item.totalPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary / Total Breakdown */}
          <div className="border-t border-dashed border-slate-300 pt-4 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (Taxable Value):</span>
              <span>₹{Number(sale.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Tax (GST):</span>
              <span>₹{Number(sale.taxAmount).toFixed(2)}</span>
            </div>
            {Number(sale.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount Applied:</span>
                <span>- ₹{Number(sale.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-300">
              <span>Grand Total Payable:</span>
              <span className="text-emerald-600">₹{Number(sale.totalAmount).toFixed(2)}</span>
            </div>

            {sale.paymentMethod === 'CASH' && sale.amountTendered && (
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 text-slate-600 text-[11px]">
                <div>Cash Tendered: <strong>₹{Number(sale.amountTendered).toFixed(2)}</strong></div>
                <div className="text-right">Change Returned: <strong>₹{Number(sale.changeAmount || 0).toFixed(2)}</strong></div>
              </div>
            )}
          </div>

          {/* Barcode graphic & footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-1">
            <div className="font-mono text-xs tracking-widest text-slate-600 font-bold">
              ||| | ||||| || |||||| | |||| ||| |||||||
            </div>
            <p className="font-mono">{sale.invoiceNumber}</p>
            <p className="text-slate-500 font-medium">Thank you for visiting SuperMart! Have a great day.</p>
            <p className="text-[9px]">Goods sold can be exchanged within 7 days against original invoice. Terms apply.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
