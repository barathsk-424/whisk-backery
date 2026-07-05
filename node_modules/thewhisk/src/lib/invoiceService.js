import { supabase } from './supabase';
import { jsPDF } from 'jspdf';

const API_URL = import.meta.env.VITE_API_URL || "https://whisk-backery.onrender.com";

/**
 * Saves a new invoice archive entry to the Supabase vault.
 * @param {Object} invoiceData - Metadata including order_id, name, amount, etc.
 */
export const saveInvoiceToSupabase = async (invoiceData) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          order_id: invoiceData.order_id,
          customer_name: invoiceData.customer_name,
          amount: invoiceData.amount || invoiceData.total_amount,
          status: invoiceData.status || 'Verified',
          date: new Date().toISOString(),
          // Extend if needed: customer_email, subtotal, etc.
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[InvoiceService] Save failure:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Recovers or Generates an invoice record via the backend bridge.
 * This ensures GST calculations and shop metadata are synchronized.
 * @param {string} orderId 
 */
export const getInvoiceByOrderId = async (orderId) => {
  try {
    // 1. Attempt Backend Optimization (Auto-generates if missing)
    try {
        const response = await fetch(`${API_URL}/api/invoices/order/${orderId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) return { success: true, data: data.invoice };
        }
    } catch (e) {
        console.warn("[InvoiceService] Backend bridge silent, falling back to Vault...");
    }

    // 2. Direct Vault Recovery
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[InvoiceService] Retrieval error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Generates and downloads a professional PDF acquisition record using jsPDF.
 * @param {Object} invoiceData 
 * @param {Array} items - Optional items list from the order
 */
export const downloadInvoiceAsPDF = (invoiceData, items = []) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    // Theme Colors
    const colors = {
      accent: [255, 107, 53],
      primary: [74, 42, 26],
      muted: [166, 124, 82],
      watermark: [244, 241, 237],
      card: [250, 249, 246]
    };

    let cursorY = 20;

    // Helper: Add Watermark
    const addBackground = () => {
      doc.setTextColor(...colors.watermark);
      doc.setFontSize(80);
      doc.setFont('helvetica', 'bold');
      doc.text('ARTISAN INVOICE', pageWidth / 2, pageHeight / 2, { angle: 45, align: 'center' });
    };

    // Helper: Safe Number Format
    const n = (val) => isNaN(val) ? 0 : Number(val);
    const formatCurrency = (val) => `Rs.${n(val).toLocaleString(undefined, { minimumFractionDigits: 1 })}`;

    // Initial Page Setup
    addBackground();
    
    // ─── HEADER: Logo & Shop Info ───
    doc.setFillColor(255, 180, 210); // Pink
    doc.circle(28, cursorY + 5, 7, 'F');
    doc.setFillColor(100, 180, 255); // Blue
    doc.rect(23, cursorY + 11, 10, 6, 'F');

    doc.setFontSize(26);
    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('THE WHISK BAKERY', 55, cursorY + 12); // Moved down slightly (+2)
    
    doc.setFontSize(9);
    doc.setTextColor(...colors.muted);
    doc.setFont('helvetica', 'normal');
    const shopAddr = 'MANNIVAKKAM, CHENNAI, TAMIL NADU, 600048';
    doc.text(shopAddr, 55, cursorY + 20); // Moved down (+3)
    doc.text('PH: +91 6374618833 | EMAIL: SKBARATH424@GMAIL.COM', 55, cursorY + 25); // Moved down (+3)
    doc.setTextColor(...colors.accent);
    doc.text(`GSTIN: ${invoiceData.shop_gstin || '29AAAAA0000A1Z5'}`, 55, cursorY + 30); // Moved down (+3)

    // ─── HEADER: Meta Info (Right Side) ───
    const rightX = pageWidth - margin;
    doc.setTextColor(...colors.muted);
    doc.setFontSize(8);
    doc.text('SIGNAL / INVOICE ID', rightX, cursorY + 5, { align: 'right' });
    doc.setFontSize(16);
    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(String(invoiceData.invoice_id || 'ID-PENDING'), rightX, cursorY + 12, { align: 'right' });
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.setFont('helvetica', 'normal');
    doc.text('TIMESTAMP GENERATED', rightX, cursorY + 20, { align: 'right' }); // Increased gap
    doc.setTextColor(...colors.primary);
    doc.text(new Date().toLocaleString(), rightX, cursorY + 26, { align: 'right' });
    
    doc.setTextColor(...colors.muted);
    doc.text('ORDER REFERENCE', rightX, cursorY + 34, { align: 'right' }); // Increased gap
    doc.setTextColor(...colors.accent);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${String(invoiceData.order_id || 'REF').slice(-8).toUpperCase()}`, rightX, cursorY + 41, { align: 'right' });

    cursorY += 55; // Increased from 50
    doc.setDrawColor(...colors.watermark);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 15;

    // ─── CUSTOMER & SHIPMENT SECTION ───
    doc.setFillColor(...colors.card);
    doc.roundedRect(margin, cursorY, 85, 48, 3, 3, 'F'); // Increased height
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.accent);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO CUSTOMER', margin + 5, cursorY + 10); // Moved down
    
    doc.setFontSize(13);
    doc.setTextColor(...colors.primary);
    doc.text(String(invoiceData.customer_name || 'Artisan Guest').toUpperCase(), margin + 5, cursorY + 22); // Increased gap
    
    doc.setFontSize(10);
    doc.setTextColor(...colors.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.customer_email || 'guest@thewhisk.com', margin + 5, cursorY + 30);
    doc.text(`TEL: ${invoiceData.customer_phone || 'N/A'}`, margin + 5, cursorY + 38);

    // Shipment Coordinates
    const midX = 115;
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.setFont('helvetica', 'bold');
    doc.text('SHIPMENT COORDINATES / ADDRESS', midX, cursorY + 10);
    
    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'normal');
    const addressLines = doc.splitTextToSize(String(invoiceData.customer_address || 'Collection from Bakery Depot'), 75);
    doc.text(addressLines, midX, cursorY + 22);

    cursorY += 65; // Increased from 60

    // ─── ITEMIZATION TABLE ───
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.setFont('helvetica', 'bold');
    doc.text('BLUEPRINT / PRODUCT DESCRIPTION', margin, cursorY);
    doc.text('QTY', margin + 90, cursorY, { align: 'center' });
    doc.text('UNIT PRICE', margin + 120, cursorY, { align: 'right' });
    doc.text('ACQUISITION TOTAL', pageWidth - margin, cursorY, { align: 'right' });
    
    cursorY += 4;
    doc.setLineWidth(0.2);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 16; // Increased from 14

    // Items Loop
    const itemsToRender = Array.isArray(items) && items.length > 0 ? items : (invoiceData.items || []);
    itemsToRender.forEach((item) => {
        const itemName = (item.name || item.product_name || 'Artisan Piece').toUpperCase();
        const itemNameLines = doc.splitTextToSize(itemName, 80);
        
        const extraLines = itemNameLines.length - 1;
        const rowHeight = 25 + (extraLines * 6); // Increased base height

        if (cursorY + rowHeight > pageHeight - 80) {
            doc.addPage();
            addBackground();
            cursorY = 20;
            // Repeat Table Header
            doc.setFontSize(8);
            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'bold');
            doc.text('BLUEPRINT / PRODUCT DESCRIPTION', margin, cursorY);
            doc.text('QTY', margin + 90, cursorY, { align: 'center' });
            doc.text('UNIT PRICE', margin + 120, cursorY, { align: 'right' });
            doc.text('ACQUISITION TOTAL', pageWidth - margin, cursorY, { align: 'right' });
            cursorY += 4;
            doc.line(margin, cursorY, pageWidth - margin, cursorY);
            cursorY += 16;
        }

        doc.setFontSize(12);
        doc.setTextColor(...colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.text(itemNameLines, margin, cursorY);
        
        // Vertical centering: Offset single-line columns by half the height of the name block
        const verticalAlignOffset = (extraLines * 6) / 2;

        doc.setFontSize(11);
        doc.setTextColor(...colors.primary);
        doc.setFont('helvetica', 'normal');
        doc.text(String(item.quantity || item.qty || 1), margin + 90, cursorY + verticalAlignOffset, { align: 'center' });
        doc.text(formatCurrency(item.price || 0), margin + 120, cursorY + verticalAlignOffset, { align: 'right' });
        
        const lineTotal = n(item.price) * n(item.quantity || item.qty || 1);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(lineTotal), pageWidth - margin, cursorY + verticalAlignOffset, { align: 'right' });

        doc.setFontSize(8);
        doc.setTextColor(...colors.muted);
        doc.setFont('helvetica', 'italic');
        const meta = `FLAVOR: ${item.flavor || 'Truffle'} | SHAPE: ${item.shape || 'Std'}`;
        doc.text(meta, margin, cursorY + 10 + (extraLines * 6));

        cursorY += rowHeight;
    });

    if (cursorY > pageHeight - 90) {
        doc.addPage();
        addBackground();
        cursorY = 25;
    } else {
        cursorY += 20;
    }

    doc.setDrawColor(...colors.muted);
    doc.setLineWidth(0.2);
    doc.line(pageWidth - 100, cursorY, pageWidth - margin, cursorY);
    cursorY += 12;

    const summaryX = pageWidth - 100;
    const valueX = pageWidth - margin;

    doc.setFontSize(10);
    doc.setTextColor(...colors.muted);
    doc.setFont('helvetica', 'normal');
    
    doc.text('SUBTOTAL (EXCL. TAX)', summaryX, cursorY);
    doc.text(formatCurrency(invoiceData.subtotal || (n(invoiceData.total_amount) / 1.18)), valueX, cursorY, { align: 'right' });
    
    cursorY += 8;
    doc.text('CGST (9%)', summaryX, cursorY);
    doc.text(formatCurrency(n(invoiceData.gst_amount) / 2 || (n(invoiceData.total_amount) * 0.09)), valueX, cursorY, { align: 'right' });
    
    cursorY += 8;
    doc.text('SGST (9%)', summaryX, cursorY);
    doc.text(formatCurrency(n(invoiceData.gst_amount) / 2 || (n(invoiceData.total_amount) * 0.09)), valueX, cursorY, { align: 'right' });

    cursorY += 10;
    doc.setFillColor(...colors.accent);
    doc.rect(summaryX, cursorY, 80, 0.5, 'F');
    
    cursorY += 10; // Extra room
    doc.setFontSize(10);
    doc.setTextColor(...colors.accent);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL ACQUISITION AMT', valueX, cursorY, { align: 'right' }); // Label on right now
    
    cursorY += 12;
    doc.setFontSize(22);
    doc.setTextColor(...colors.primary);
    doc.text(formatCurrency(invoiceData.total_amount || invoiceData.amount || 0), valueX, cursorY, { align: 'right' });

    // ─── FOOTER ───
    const footerY = pageHeight - 15;
    doc.setFontSize(7);
    doc.setTextColor(...colors.muted);
    doc.text('THE WHISK BAKERY // AUTHENTIC ARTISAN RECORD V2.0 // HANDCRAFTED IN TAMIL NADU', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Thank you for choosing artisan quality.', pageWidth / 2, footerY + 4, { align: 'center' });

    doc.save(`Whisk_Invoice_${invoiceData.invoice_id || invoiceData.order_id || 'Signal'}.pdf`);
    return { success: true };

  } catch (err) {
    console.error('[PDF Generator] Fatal error:', err.message);
    return { success: false, error: err.message };
  }
};
