import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 18, marginBottom: 4, fontWeight: 700 },
  subtitle: { fontSize: 10, color: '#666', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  section: { marginBottom: 16 },
  label: { color: '#666' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 8, borderTop: '1 solid #ddd' },
  totalLabel: { fontSize: 13, fontWeight: 700 },
});

export interface InvoiceData {
  invoiceNumber: string;
  issuedAt: string;
  bookingCode: string;
  senderName: string;
  recipientName: string;
  pickupAddress: string;
  dropoffAddress: string;
  parcelDescription: string | null;
  amount: number;
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>WACOSE Logistics</Text>
        <Text style={styles.subtitle}>Invoice {data.invoiceNumber}</Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Booking reference</Text>
            <Text>{data.bookingCode}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Issued</Text>
            <Text>{new Date(data.issuedAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>From</Text>
            <Text>{data.senderName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pickup</Text>
            <Text>{data.pickupAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>To</Text>
            <Text>{data.recipientName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Drop-off</Text>
            <Text>{data.dropoffAddress}</Text>
          </View>
          {data.parcelDescription && (
            <View style={styles.row}>
              <Text style={styles.label}>Parcel</Text>
              <Text>{data.parcelDescription}</Text>
            </View>
          )}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalLabel}>KES {data.amount.toFixed(2)}</Text>
        </View>
      </Page>
    </Document>
  );
}
