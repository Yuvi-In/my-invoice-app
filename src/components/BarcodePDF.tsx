import React from 'react';
import { Document, Page, Image, Text, View, StyleSheet } from '@react-pdf/renderer';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 20,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
    alignItems: 'center',
  },
  barcode: {
    width: 200,
    height: 50,
  },
  text: {
    fontSize: 12,
    marginTop: 10,
  },
});

interface BarcodePDFProps {
  barcode: string;
  productId: string;
}

const BarcodePDF: React.FC<BarcodePDFProps> = ({ barcode, productId }) => {
  const canvas = createCanvas(200, 50);
  JsBarcode(canvas, barcode, { format: 'CODE128', displayValue: true });
  const barcodeDataUrl = canvas.toDataURL('image/png');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Image src={barcodeDataUrl} style={styles.barcode} />
          <Text style={styles.text}>{productId}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default BarcodePDF;