// import React, { useState, useEffect, ChangeEvent } from 'react';
import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';

import Footer from '../components/Footer';
import PageContainer from '../components/PageContainer';
import Header from '../components/Header';
import type { History } from '../types';
import SectionHeading from '../components/SectionHeading';
import { Row, Col, Container } from 'react-bootstrap';
import Table from '../components/Table';
import Searchbar from '../components/Searchbar';
import EditButton from '../components/EditButton';
import DeleteButton from '../components/DeleteButton';
import EditModal from '../components/EditModal';
import { historyServiceFactory } from '../services/history/factory';
import { patientServiceFactory } from '../services/patient/factory';
import { historyFormConfig } from '../components/forms/formConfigs';

const HistoryPage: React.FC<{ sidebarCollapsed: boolean; toggleSidebar: () => void }> = ({ sidebarCollapsed, toggleSidebar }) => {
  const [history, setHistory] = useState<History[]>([]);
  const [patients, setPatients] = useState<{ id?: string; firstName?: string; lastName?: string; name?: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<History | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);

  // Service instances
  const historyService = historyServiceFactory.getService();
  const patientService = patientServiceFactory.getService();

  // Fetch history and patients on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [historyData, patientsData] = await Promise.all([
          historyService.getAllHistory(),
          patientService.getAllPatients(),
        ]);
        setHistory(historyData);
        setPatients(patientsData);
      } catch (err) {
        setError('Failed to load history or patients.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [historyService, patientService]);

  // Filter history based on search term and selected patient
  const getFilteredHistory = () => {
    let filteredHistory = history;
    if (selectedPatient) {
      filteredHistory = filteredHistory.filter(h => h.patientId === selectedPatient);
    }
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredHistory = filteredHistory.filter(h => 
        h.patientName?.toLowerCase().includes(searchLower) ||
        h.date?.toLowerCase().includes(searchLower) ||
        h.parameters?.toLowerCase().includes(searchLower) ||
        h.notes?.toLowerCase().includes(searchLower) ||
        h.nursingNotes?.toLowerCase().includes(searchLower) ||
        h.amount?.toString().includes(searchLower)
      );
    }
    return filteredHistory;
  };

  const handlePatientChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedPatient(e.target.value);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle edit
  const handleEdit = (id: string | number) => {
    const historyToEdit = history.find(h => h.id === id);
    if (historyToEdit) {
      setEditingData(historyToEdit);
      setShowEditModal(true);
    }
  };

  // Handle delete
  const handleDelete = async (id: string | number) => {
    const historyToDelete = history.find(h => h.id === id);
    const historyName = historyToDelete ? historyToDelete.patientName : 'this history record';

    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${historyName}? This action cannot be undone.`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      await historyService.softDeleteHistory(id);
      // Remove from local state
      setHistory(prevHistory => prevHistory.filter(h => h.id !== id));
    } catch (err) {
      console.error('Error deleting history:', err);
      setError('Failed to delete history record. Please try again.');
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (values: any) => {
    if (!editingData) return;
    
    setEditLoading(true);
    try {
      const updatedHistory = await historyService.updateHistory(editingData.id!, {
        patientName: values.patientName,
        date: values.date,
        parameters: values.parameters,
        amount: values.amount,
        age: values.age,
        gender: values.gender,
        notes: values.notes,
        nursingNotes: values.nursingNotes,
      });
      
      // Update local state
      setHistory(prevHistory => 
        prevHistory.map(h => h.id === editingData.id ? updatedHistory : h)
      );
      
      setShowEditModal(false);
      setEditingData(null);
    } catch (error) {
      console.error('Error updating history:', error);
      throw error;
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingData(null);
    setEditLoading(false);
  };

  return (
    <>
      <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      <PageContainer>
        <SectionHeading title="History" subtitle="View and manage dialysis session history" />
        <div className="history-header">
          <h2 className="history-title">Dialysis History</h2>
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          <div className="history-filters" >
            <div className="history-filter-group">
              <div className="form-group">
                <label htmlFor="patient" className="form-label">Filter by Patient</label>
                <select
                  id="patient"
                  className="form-select"
                  value={selectedPatient}
                  onChange={handlePatientChange}
                  disabled={loading}
                >
                  <option value="">All Patients</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {(patient.firstName || '') + ' ' + (patient.lastName || '')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="history-search-group">
              <Searchbar 
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
        <div className='history-table-container' style={{ width: '100%', marginLeft: 0, marginRight: 0, paddingBottom: 0 }}>
          {loading ? (
            <div className="alert alert-info">Loading history...</div>
          ) : getFilteredHistory().length === 0 ? (
            <div className="alert alert-info">No dialysis history found.</div>
          ) : (
            <div className="table-container" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Table
                columns={[
                  { key: 'date', header: 'Date' },
                  { key: 'patientName', header: 'Patient' },
                  { key: 'parameters', header: 'Parameters' },
                  { key: 'notes', header: 'Notes' },
                  { key: 'amount', header: 'Amount' },
                  { key: 'actions', header: 'Actions' },
                ]}
                data={getFilteredHistory().map((h, i) => ({
                  id: h.id || i,
                  date: h.date,
                  patientName: h.patientName,
                  parameters: h.parameters || h.treatmentParameters?.dialyzer || '-',
                  notes: h.notes || h.nursingNotes || '-',
                  amount: h.amount || '-',
                  actions: (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <EditButton onClick={() => handleEdit(h.id!)} />
                      <DeleteButton onClick={() => handleDelete(h.id!)} />
                    </div>
                  ),
                }))}
              />
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <EditModal
          show={showEditModal}
          onHide={handleCloseEditModal}
          data={editingData}
          formConfig={historyFormConfig}
          onSubmit={handleEditSubmit}
          loading={editLoading}
          editingDataType="history"
        />
      </PageContainer>
      <Footer />
    </>
  );
};

export default HistoryPage; 