'use client';

import React, { useRef, useState, useMemo } from 'react';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Printer,
    QrCode,
    ScanLine,
    FileDown,
    Copy,
    Check,
    AlertTriangle
} from 'lucide-react';
import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/utils';

interface BarcodeGeneratorProps {
    value: string;
    name?: string;
    price?: number;
    sku?: string;
}

// CODE128 supports ASCII characters 0-127
// For best compatibility, we validate against common scannable characters
const CODE128_VALID_CHARS = /^[\x00-\x7F]+$/;
const QR_MAX_LENGTH = 2953; // Maximum for QR Code version 40 with error correction level L

interface ValidationResult {
    isValid: boolean;
    error?: string;
    warning?: string;
}

/**
 * Validates a barcode value for CODE128 format
 */
export function validateBarcodeValue(value: string): ValidationResult {
    if (!value || value.trim().length === 0) {
        return { isValid: false, error: 'Barcode value cannot be empty' };
    }
    
    if (value.length < 1) {
        return { isValid: false, error: 'Barcode value is too short' };
    }
    
    if (value.length > 80) {
        return { isValid: false, error: 'Barcode value is too long (max 80 characters)' };
    }
    
    if (!CODE128_VALID_CHARS.test(value)) {
        return { isValid: false, error: 'Barcode contains invalid characters. Use only ASCII characters.' };
    }
    
    // Warning for values that might not scan well
    if (value.length < 4) {
        return { isValid: true, warning: 'Short barcodes may be harder to scan' };
    }
    
    return { isValid: true };
}

/**
 * Validates a value for QR code encoding
 */
export function validateQRCodeValue(value: string): ValidationResult {
    if (!value || value.trim().length === 0) {
        return { isValid: false, error: 'QR code value cannot be empty' };
    }
    
    if (value.length > QR_MAX_LENGTH) {
        return { isValid: false, error: `QR code value is too long (max ${QR_MAX_LENGTH} characters)` };
    }
    
    // Warning for very long values
    if (value.length > 100) {
        return { isValid: true, warning: 'Long values create dense QR codes that may be harder to scan' };
    }
    
    return { isValid: true };
}

export function BarcodeGenerator({ value, name, price, sku }: BarcodeGeneratorProps) {
    const [format, setFormat] = useState<'barcode' | 'qrcode'>('barcode');
    const [quantity, setQuantity] = useState(1);
    const [copied, setCopied] = useState(false);

    // Refs for DOM elements to capture images from
    const barcodeRef = useRef<any>(null);
    const qrRef = useRef<SVGSVGElement>(null);

    // Validate the value based on current format
    const validation = useMemo(() => {
        if (format === 'barcode') {
            return validateBarcodeValue(value);
        }
        return validateQRCodeValue(value);
    }, [value, format]);

    // Helper to get SVG string or Data URL
    const getChartImage = (): string | null => {
        if (format === 'barcode') {
            // react-barcode renders an SVG inside the component. 
            // We can find the SVG element via DOM or Ref.
            // Note: react-barcode ref might point to the container.
            // Let's rely on finding the SVG in the container for simplicity in this robust implementation.
            const svg = document.querySelector('#barcode-container svg') as SVGSVGElement;
            if (!svg) return null;
            const svgData = new XMLSerializer().serializeToString(svg);
            return `data:image/svg+xml;base64,${btoa(svgData)}`;
        } else {
            if (!qrRef.current) return null;
            const svgData = new XMLSerializer().serializeToString(qrRef.current);
            return `data:image/svg+xml;base64,${btoa(svgData)}`;
        }
    };

    // Convert SVG to PNG Canvas for simple download
    const downloadPNG = () => {
        const svg = format === 'barcode'
            ? document.querySelector('#barcode-container svg') as SVGSVGElement
            : qrRef.current;

        if (!svg) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        // Set explicit size for better quality
        const width = format === 'barcode' ? 300 : 200;
        const height = format === 'barcode' ? 100 : 200;
        canvas.width = width;
        canvas.height = height;

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            ctx?.drawImage(img, 0, 0, width, height);
            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `${sku || value}-${format}.png`;
            a.click();
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        const svg = format === 'barcode'
            ? document.querySelector('#barcode-container svg') as SVGSVGElement
            : qrRef.current;

        if (!svg) return;

        // We need to draw the SVG to a canvas first to get a data URL for jsPDF
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const w = format === 'barcode' ? 200 : 150; // px dimensions for canvas
        const h = format === 'barcode' ? 80 : 150;

        canvas.width = w;
        canvas.height = h;

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            if (!ctx) return;

            // Paint white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);

            const imgData = canvas.toDataURL('image/png');

            // Label Dimensions (e.g. 5x3 cm roughly on A4)
            const labelWidth = format === 'barcode' ? 50 : 30; // mm
            const labelHeight = format === 'barcode' ? 25 : 30; // mm
            const marginX = 10;
            const marginY = 10;
            const gapX = 5;
            const gapY = 5;

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            let x = marginX;
            let y = marginY;

            for (let i = 0; i < quantity; i++) {
                // Check new page
                if (y + labelHeight > pageHeight - marginY) {
                    doc.addPage();
                    y = marginY;
                    x = marginX;
                }

                // Draw Border (Optional, helpful for cutting)
                doc.setDrawColor(200, 200, 200);
                doc.rect(x, y, labelWidth, labelHeight);

                // Draw Item Name (Truncated)
                doc.setFontSize(8);
                doc.text(name?.substring(0, 20) || 'Item', x + labelWidth / 2, y + 5, { align: 'center' });

                // Draw Image
                // Center the image in the label
                const imgW = labelWidth - 4;
                const imgH = labelHeight - 12; // save space for text
                // Keep aspect ratio
                const ratio = w / h;
                let drawW = imgW;
                let drawH = drawW / ratio;
                if (drawH > imgH) {
                    drawH = imgH;
                    drawW = drawH * ratio;
                }

                doc.addImage(imgData, 'PNG', x + (labelWidth - drawW) / 2, y + 7, drawW, drawH);

                // Draw Price/SKU
                doc.setFontSize(7);
                const bottomText = price ? formatCurrency(price) : (sku || value);
                doc.text(bottomText, x + labelWidth / 2, y + labelHeight - 2, { align: 'center' });

                // Move absolute position
                x += labelWidth + gapX;
                if (x + labelWidth > pageWidth - marginX) {
                    x = marginX;
                    y += labelHeight + gapY;
                }
            }

            doc.save(`${sku || 'labels'}-${quantity}qty.pdf`);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!value) return null;

    return (
        <div className="space-y-4 rounded-xl border border-border bg-card p-3 sm:p-4">
            {/* Header with format toggle - responsive layout */}
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                    {format === 'barcode' ? <ScanLine className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
                    <span className="truncate">Generated Code</span>
                </h3>
                <div className="flex bg-secondary rounded-lg p-1 self-start xs:self-auto">
                    <button
                        type="button"
                        onClick={() => setFormat('barcode')}
                        className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all touch-target-min min-h-[36px] ${format === 'barcode' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Barcode
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormat('qrcode')}
                        className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all touch-target-min min-h-[36px] ${format === 'qrcode' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        QR Code
                    </button>
                </div>
            </div>

            {/* Validation Warning/Error */}
            {!validation.isValid && validation.error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>{validation.error}</span>
                </div>
            )}
            
            {validation.isValid && validation.warning && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>{validation.warning}</span>
                </div>
            )}

            {/* Preview Area - responsive */}
            <div className={`flex flex-col items-center justify-center p-4 sm:p-6 bg-white rounded-lg border-2 border-dashed min-h-[140px] sm:min-h-[160px] overflow-hidden ${
                !validation.isValid ? 'border-red-300 bg-red-50/50' : 'border-border/50'
            }`}>
                {validation.isValid ? (
                    <>
                        {format === 'barcode' ? (
                            <div id="barcode-container" className="max-w-full overflow-x-auto">
                                <Barcode
                                    value={value}
                                    width={1.5}
                                    height={50}
                                    fontSize={12}
                                    displayValue={true}
                                    margin={0}
                                    background="transparent"
                                />
                            </div>
                        ) : (
                            <QRCodeSVG
                                ref={qrRef}
                                value={value}
                                size={100}
                                level="H"
                                includeMargin={true}
                                className="sm:w-[128px] sm:h-[128px]"
                            />
                        )}
                    </>
                ) : (
                    <div className="text-center text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                        <p className="text-sm">Cannot generate {format === 'barcode' ? 'barcode' : 'QR code'}</p>
                        <p className="text-xs mt-1">Please fix the validation error above</p>
                    </div>
                )}

                <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground max-w-full">
                    <span className="font-mono bg-secondary px-2 py-0.5 rounded text-foreground truncate max-w-[200px] sm:max-w-none">{value}</span>
                    <button
                        type="button"
                        onClick={copyToClipboard}
                        className="hover:text-primary transition-colors flex-shrink-0 h-8 w-8 flex items-center justify-center touch-target-min"
                        title="Copy Value"
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Controls - responsive layout */}
            <div className="space-y-4">
                {/* Quantity controls */}
                <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Print Quantity</Label>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 touch-target-min flex-shrink-0"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                            -
                        </Button>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="h-11 text-center flex-1 min-w-[60px]"
                            min="1"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 touch-target-min flex-shrink-0"
                            onClick={() => setQuantity(quantity + 1)}
                        >
                            +
                        </Button>
                    </div>
                </div>

                {/* Download/Print buttons - stack on mobile */}
                <div className="flex flex-col xs:flex-row gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-11 touch-target-min text-sm"
                        onClick={downloadPNG}
                        disabled={!validation.isValid}
                    >
                        <FileDown className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>PNG</span>
                    </Button>
                    <Button
                        type="button"
                        className="flex-1 h-11 touch-target-min text-sm"
                        onClick={downloadPDF}
                        disabled={!validation.isValid}
                    >
                        <Printer className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Print PDF</span>
                    </Button>
                </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
                PDF generates {quantity} label(s) for printing on sticker sheets.
            </p>
        </div>
    );
}
