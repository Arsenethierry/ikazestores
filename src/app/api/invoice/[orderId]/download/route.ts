// app/api/invoice/[orderId]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthState } from "@/lib/user-permission";
import { OrderModel } from "@/lib/models/OrderModel";
import { VirtualStore } from "@/lib/models/virtual-store";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { OrderItemsModel } from "@/lib/models/OrderItemsModel";

const orderModel = new OrderModel();
const virtualStoreModel = new VirtualStore();
const orderItemsModel = new OrderItemsModel();

// Extend jsPDF type for autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

function generateInvoicePDF(data: {
  order: any;
  items: any[];
  customer: any;
  virtualStore: any;
}): Buffer {
  const { order, items, customer, virtualStore } = data;

  // Create new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Set document properties
  doc.setProperties({
    title: `Invoice ${order.orderNumber}`,
    subject: `Invoice for order ${order.orderNumber}`,
    author: virtualStore.storeName,
    keywords: "invoice, order",
    creator: virtualStore.storeName,
  });

  // Color scheme
  const primaryColor = "#2563eb";
  const textColor = "#1f2937";
  const lightGray = "#f3f4f6";
  const darkGray = "#6b7280";

  let yPosition = 20;

  // Header - Store Logo/Name and Invoice Details
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(virtualStore.storeName, 20, yPosition);

  // Invoice label and number
  doc.setFontSize(20);
  doc.setTextColor(textColor);
  doc.text("INVOICE", 140, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.setTextColor(darkGray);
  doc.setFont("helvetica", "normal");
  doc.text(virtualStore.operatingCountry, 20, yPosition);

  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(`#${order.orderNumber}`, 140, yPosition);

  yPosition += 6;
  doc.setFontSize(10);
  doc.setTextColor(darkGray);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${format(new Date(order.orderDate), "PPP")}`, 140, yPosition);

  yPosition += 5;
  // Order status badge
  const statusText = order.orderStatus.toUpperCase();
  const statusWidth = doc.getTextWidth(statusText) + 6;
  doc.setFillColor(220, 252, 231); // Light green background
  doc.roundedRect(140, yPosition - 3, statusWidth, 6, 1, 1, "F");
  doc.setTextColor(22, 101, 52); // Dark green text
  doc.setFontSize(8);
  doc.text(statusText, 143, yPosition);

  // Separator line
  yPosition += 10;
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);

  // Billing and Shipping Information
  yPosition += 10;
  doc.setFontSize(12);
  doc.setTextColor(textColor);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, yPosition);
  doc.text("Ship To:", 110, yPosition);

  yPosition += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(darkGray);

  // Customer info
  const customerInfo = [customer.email, customer.phone || ""]
    .filter(Boolean)
    .join("\n");
  doc.text(customerInfo, 20, yPosition);

  // Shipping address
  const shippingLines = (
    order.deliveryAddress || "Same as billing address"
  ).split(",");
  let shipY = yPosition;
  shippingLines.forEach((line: string) => {
    if (line.trim()) {
      doc.text(line.trim(), 110, shipY);
      shipY += 5;
    }
  });

  yPosition = Math.max(yPosition + 15, shipY + 5);

  // Payment Information Box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(20, yPosition, 170, 20, 2, 2, "F");

  yPosition += 6;
  doc.setFontSize(10);
  doc.setTextColor(textColor);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Method:", 25, yPosition);
  doc.text("Payment Status:", 80, yPosition);
  if (order.estimatedDeliveryDate) {
    doc.text("Est. Delivery:", 135, yPosition);
  }

  yPosition += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(darkGray);
  doc.text(order.paymentMethod, 25, yPosition);
  doc.text(order.paymentStatus.toUpperCase(), 80, yPosition);
  if (order.estimatedDeliveryDate) {
    doc.text(
      format(new Date(order.estimatedDeliveryDate), "PP"),
      135,
      yPosition
    );
  }

  yPosition += 12;

  // Items Table
  const tableColumns = [
    { header: "Item", dataKey: "item" },
    { header: "SKU", dataKey: "sku" },
    { header: "Qty", dataKey: "quantity" },
    { header: "Unit Price", dataKey: "unitPrice" },
    { header: "Total", dataKey: "total" },
  ];

  const tableRows = items.map((item) => ({
    item: item.productName,
    sku: item.sku,
    quantity: item.quantity || 1,
    unitPrice: `${item.sellingPrice.toFixed(2)} ${order.currency}`,
    total: `${item.subtotal.toFixed(2)} ${order.currency}`,
  }));

  autoTable(doc, {
    startY: yPosition,
    head: [tableColumns.map((col) => col.header)],
    body: tableRows.map((row) => [
      row.item,
      row.sku,
      row.quantity,
      row.unitPrice,
      row.total,
    ]),
    theme: "striped",
    headStyles: {
      fillColor: [249, 250, 251],
      textColor: [55, 65, 81],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [75, 85, 99],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 70 }, // Item
      1: { cellWidth: 35 }, // SKU
      2: { cellWidth: 20, halign: "center" }, // Qty
      3: { cellWidth: 30, halign: "right" }, // Unit Price
      4: { cellWidth: 30, halign: "right" }, // Total
    },
    margin: { left: 20, right: 20 },
    didDrawPage: (data) => {
      yPosition = (data.cursor && data.cursor.y) || 0;
    },
  });

  // Update yPosition after table
  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Order Summary
  const summaryX = 120;
  doc.setFontSize(10);

  // Subtotal
  doc.setTextColor(darkGray);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", summaryX, yPosition);
  doc.text(`${order.subtotal.toFixed(2)} ${order.currency}`, 170, yPosition, {
    align: "right",
  });

  yPosition += 6;

  // Shipping
  if (order.shippingCost > 0) {
    doc.text("Shipping:", summaryX, yPosition);
    doc.text(
      `${order.shippingCost.toFixed(2)} ${order.currency}`,
      170,
      yPosition,
      { align: "right" }
    );
    yPosition += 6;
  }

  // Tax
  if (order.taxAmount > 0) {
    doc.text("Tax:", summaryX, yPosition);
    doc.text(
      `${order.taxAmount.toFixed(2)} ${order.currency}`,
      170,
      yPosition,
      { align: "right" }
    );
    yPosition += 6;
  }

  // Discount
  if (order.discountAmount > 0) {
    doc.text("Discount:", summaryX, yPosition);
    doc.text(
      `-${order.discountAmount.toFixed(2)} ${order.currency}`,
      170,
      yPosition,
      { align: "right" }
    );
    yPosition += 6;
  }

  // Total line
  doc.setLineWidth(0.5);
  doc.setDrawColor(229, 231, 235);
  doc.line(summaryX, yPosition, 170, yPosition);

  yPosition += 6;
  doc.setFontSize(14);
  doc.setTextColor(textColor);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", summaryX, yPosition);
  doc.setTextColor(primaryColor);
  doc.text(
    `${order.totalAmount.toFixed(2)} ${order.currency}`,
    170,
    yPosition,
    { align: "right" }
  );

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  yPosition = pageHeight - 40;

  // Footer separator
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.2);
  doc.line(20, yPosition, 190, yPosition);

  yPosition += 6;
  doc.setFontSize(9);
  doc.setTextColor(darkGray);
  doc.setFont("helvetica", "normal");

  // Terms & Conditions
  doc.text("Terms & Conditions:", 20, yPosition);
  yPosition += 4;
  doc.setFontSize(8);
  const termsText =
    "Returns accepted within 30 days. Original condition required. Contact support for assistance.";
  const termsLines = doc.splitTextToSize(termsText, 80);
  doc.text(termsLines, 20, yPosition);

  // Contact Info
  doc.setFontSize(9);
  doc.text("Contact:", 110, yPosition - 4);
  doc.setFontSize(8);
  doc.text(`support@${virtualStore.subDomain}.com`, 110, yPosition);
  doc.text(`Reference: ${order.orderNumber}`, 110, yPosition + 4);

  // Thank you message
  yPosition = pageHeight - 15;
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(20, yPosition - 5, 170, 12, 2, 2, "F");
  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.setFont("helvetica", "bold");
  doc.text("Thank You For Your Business!", 105, yPosition, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "We appreciate your order and look forward to serving you again.",
    105,
    yPosition + 4,
    { align: "center" }
  );

  // Add page numbers if multiple pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(darkGray);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 5,
      { align: "center" }
    );
  }

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { user } = await getAuthState();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.orderId;
    const order = await orderModel.findById(orderId, {});

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership
    if (order.customerId !== user.$id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get order items
    const items = await orderItemsModel.findByOrder(orderId);

    // Get virtual store info
    const virtualStore = await virtualStoreModel.findById(
      order.virtualStoreId,
      {}
    );

    if (!virtualStore) {
      return NextResponse.json(
        { error: "Virtual store not found" },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = generateInvoicePDF({
      order,
      items: items.documents,
      customer: {
        email: order.customerEmail,
        phone: order.customerPhone,
      },
      virtualStore,
    });

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${order.orderNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
