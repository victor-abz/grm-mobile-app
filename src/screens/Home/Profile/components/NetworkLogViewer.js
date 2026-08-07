/**
 * Debug viewer for the backend request log.
 *
 * Renders {@link networkLogger}'s ring buffer as an expandable list so a
 * tester on a release build can see who was signed in, what the app sent and
 * what the backend returned, then share the whole log as text.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import { networkLogger } from '../../../../utils/networkLogger';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 16, fontWeight: '600', color: colors.primary },
  actions: { flexDirection: 'row', gap: 8, padding: 12 },
  list: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, paddingHorizontal: 24 },
  entry: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { fontSize: 13, fontWeight: '700', minWidth: 38 },
  method: { fontSize: 12, fontWeight: '600', color: '#555' },
  duration: { fontSize: 11, color: '#999', marginLeft: 'auto' },
  url: { fontSize: 12, color: '#333', marginTop: 2 },
  meta: { fontSize: 10, color: '#999', marginTop: 4 },
  detail: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#666', marginTop: 6 },
  code: { fontSize: 11, fontFamily: 'monospace', color: '#333', marginTop: 2 },
});

const statusColor = (status) => {
  if (status === 0) return '#c0392b';
  if (status >= 500) return '#c0392b';
  if (status >= 400) return '#e67e22';
  return '#27ae60';
};

const LogEntry = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.entry}
      onPress={() => setExpanded((prev) => !prev)}
      activeOpacity={0.7}
    >
      <View style={styles.entryHeader}>
        <Text style={[styles.status, { color: statusColor(entry.status) }]}>
          {entry.status || 'ERR'}
        </Text>
        <Text style={styles.method}>{entry.method}</Text>
        <Text style={styles.duration}>
          {entry.durationMs !== null ? `${entry.durationMs}ms` : ''}
        </Text>
      </View>

      <Text style={styles.url} numberOfLines={expanded ? undefined : 1}>
        {entry.url}
      </Text>

      <Text style={styles.meta}>
        {entry.timestamp} · {entry.user || 'not signed in'}
      </Text>

      {expanded && (
        <View style={styles.detail}>
          {entry.requestBody ? (
            <>
              <Text style={styles.detailLabel}>Request</Text>
              <Text style={styles.code}>{entry.requestBody}</Text>
            </>
          ) : null}
          {entry.responseBody ? (
            <>
              <Text style={styles.detailLabel}>Response</Text>
              <Text style={styles.code}>{entry.responseBody}</Text>
            </>
          ) : null}
          {entry.error ? (
            <>
              <Text style={styles.detailLabel}>Error</Text>
              <Text style={[styles.code, { color: '#c0392b' }]}>{entry.error}</Text>
            </>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const NetworkLogViewer = ({ visible, onDismiss }) => {
  const [entries, setEntries] = useState(networkLogger.getEntries());

  useEffect(() => {
    if (!visible) return undefined;
    setEntries([...networkLogger.getEntries()]);
    return networkLogger.subscribe((next) => setEntries([...next]));
  }, [visible]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: networkLogger.toText() });
    } catch (_error) {
      // The user dismissed the share sheet; nothing to recover from.
    }
  }, []);

  const handleClear = useCallback(async () => {
    await networkLogger.clear();
    setEntries([]);
  }, []);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Backend requests ({entries.length})</Text>
          <IconButton icon="close" size={24} onPress={onDismiss} />
        </View>

        <View style={styles.actions}>
          <Button mode="outlined" onPress={handleShare} disabled={entries.length === 0} compact>
            Share
          </Button>
          <Button mode="outlined" onPress={handleClear} disabled={entries.length === 0} compact>
            Clear
          </Button>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {entries.length === 0 ? (
            <Text style={styles.empty}>
              No backend requests recorded yet. Use the app while online and they will appear here.
            </Text>
          ) : (
            entries.map((entry) => <LogEntry key={entry.id} entry={entry} />)
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default NetworkLogViewer;
