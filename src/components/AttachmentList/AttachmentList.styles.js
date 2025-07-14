import { StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';

export const styles = StyleSheet.create({
  attachmentsList: {
    width: '100%',
  },
  attachmentTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  attachmentTypeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attachmentItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  attachmentItemPlaying: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  attachmentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 48,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#343a40',
    marginRight: 12,
  },
  fileNamePlaying: {
    color: '#2196f3',
    fontWeight: '600',
  },
  fileTypeIndicator: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  fileTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 120,
  },
  soundWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  soundWave: {
    width: 3,
    backgroundColor: '#2196f3',
    marginHorizontal: 1,
    borderRadius: 1.5,
  },
  soundWave1: {
    height: 8,
  },
  soundWave2: {
    height: 12,
  },
  soundWave3: {
    height: 10,
  },
  soundWave4: {
    height: 6,
  },
  audioTimer: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2196f3',
    minWidth: 80,
    textAlign: 'right',
  },
  removeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#fee',
    marginLeft: 8,
  },
});