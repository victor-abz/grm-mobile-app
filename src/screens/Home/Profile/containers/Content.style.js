import { StyleSheet } from 'react-native';
import { colors } from '../../../../utils/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  offlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  offlineText: {
    color: colors.error,
    fontSize: 14,
    flex: 1,
  },
  headerSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginRight: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  changePasswordButton: {
    alignSelf: 'flex-start',
  },
  changePasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  avatarContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  avatarContainerDisabled: {
    opacity: 0.6,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  editIcon: {
    margin: 0,
    padding: 0,
  },
  infoSection: {
    marginBottom: 24,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  button: {
    marginVertical: 8,
    borderRadius: 8,
  },
  logoutButton: {
    marginTop: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  errorContainer: {
    backgroundColor: '#FFF3F3',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  errorTitle: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 8,
  },
  errorHint: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default styles;
