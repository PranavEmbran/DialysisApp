import React, { useState, useRef } from 'react';
import { Button, Alert, Card, Row, Col } from 'react-bootstrap';
import { MockPatientService } from '../services/patient/mock';
import ButtonWithGradient from './ButtonWithGradient';
import { filePersistence } from '../utils/filePersistence';

const MockDataManager: React.FC = () => {
    const [message, setMessage] = useState<{ type: 'success' | 'danger' | 'warning'; text: string } | null>(null);
    const [dataSource, setDataSource] = useState<'backup' | 'file' | 'none'>('none');
    const [apiServerStatus, setApiServerStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check data source and API server status on component mount
    React.useEffect(() => {
        const backupExists = filePersistence.hasBackupData();
        setDataSource(backupExists ? 'backup' : 'file');
        
        // Check API server status
        // fetch('http://localhost:5001/api/test')
        fetch('http://localhost:5000/api/test')
            .then(response => {
                if (response.ok) {
                    setApiServerStatus('available');
                } else {
                    setApiServerStatus('unavailable');
                }
            })
            .catch(() => {
                setApiServerStatus('unavailable');
            });
    }, []);

    const handleExport = () => {
        try {
            // Export current mock data from file persistence backup
            const backupData = filePersistence.getBackupData();
            if (backupData) {
                const dataStr = JSON.stringify(backupData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);

                const link = document.createElement('a');
                link.href = url;
                link.download = `mockdata_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                setMessage({ type: 'success', text: 'Mock data exported successfully!' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                // Fallback to old localStorage key
                const mockData = localStorage.getItem('mockData');
                if (mockData) {
                    const dataBlob = new Blob([mockData], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `mockdata_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    setMessage({ type: 'success', text: 'Mock data exported successfully!' });
                    setTimeout(() => setMessage(null), 3000);
                } else {
                    setMessage({ type: 'danger', text: 'No mock data found to export. Make some changes in mock mode first.' });
                    setTimeout(() => setMessage(null), 3000);
                }
            }
        } catch (error) {
            console.error('Export error:', error);
            setMessage({ type: 'danger', text: 'Failed to export mock data.' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = e.target?.result as string;
                // Parse to validate JSON
                const parsedData = JSON.parse(jsonData);

                // Save to localStorage backup (new system)
                localStorage.setItem('mockData_backup', jsonData);

                // Also save to old key for compatibility
                localStorage.setItem('mockData', jsonData);

                // Clear cache to force reload
                filePersistence.clearCache();

                setMessage({ type: 'success', text: 'Mock data imported successfully! Please refresh the page.' });
                setTimeout(() => setMessage(null), 3000);
            } catch (error) {
                console.error('Import error:', error);
                setMessage({ type: 'danger', text: 'Invalid JSON format. Please check your file.' });
                setTimeout(() => setMessage(null), 3000);
            }
        };
        reader.readAsText(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClearData = () => {
        if (window.confirm('Are you sure you want to clear all persistent mock data? This action cannot be undone.')) {
            // Clear both old and new localStorage keys
            localStorage.removeItem('mockData');
            localStorage.removeItem('mockData_backup');

            // Clear cache
            filePersistence.clearCache();

            setMessage({ type: 'success', text: 'Persistent mock data cleared. Please refresh the page.' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset the mock service? This will clear all data and reload from default.')) {
            // Clear both old and new localStorage keys
            localStorage.removeItem('mockData');
            localStorage.removeItem('mockData_backup');

            // Clear cache
            filePersistence.clearCache();

            setMessage({ type: 'success', text: 'Mock service reset. Please refresh the page.' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleCopyToClipboard = async () => {
        try {
            const backupData = filePersistence.getBackupData();
            if (backupData) {
                const dataStr = JSON.stringify(backupData, null, 2);
                
                // Copy to clipboard
                await navigator.clipboard.writeText(dataStr);
                
                // Also update mockData.json via API
                try {
                    // const response = await fetch('http://localhost:5001/api/mock-data/update', {
                    const response = await fetch('http://localhost:5000/api/mock-data/update', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ data: backupData })
                    });
                    
                    if (response.ok) {
                        setMessage({ 
                            type: 'success', 
                            text: 'Data copied to clipboard AND updated mockData.json automatically!' 
                        });
                    } else {
                        setMessage({ 
                            type: 'warning', 
                            text: 'Data copied to clipboard, but failed to update mockData.json. Please check if the API server is running.' 
                        });
                    }
                } catch (apiError) {
                    console.warn('API update failed:', apiError);
                    setMessage({ 
                        type: 'warning', 
                        text: 'Data copied to clipboard, but failed to update mockData.json. Please check if the API server is running.' 
                    });
                }
                
                setTimeout(() => setMessage(null), 5000);
            } else {
                setMessage({ type: 'danger', text: 'No data available to copy.' });
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error) {
            setMessage({ type: 'danger', text: 'Failed to copy data.' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <h5>Mock Data Management</h5>
                <small className="text-muted">Manage persistent mock data for development (file-based persistence)</small>
            </Card.Header>
            <Card.Body>
                {message && (
                    <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
                        {message.text}
                    </Alert>
                )}

                {/* Data Source Status */}
                <div className="mb-3">
                    <small className="text-muted">
                        <strong>Data Source:</strong>
                        {dataSource === 'backup' && (
                            <span className="text-success"> Using localStorage backup (user changes)</span>
                        )}
                        {dataSource === 'file' && (
                            <span className="text-info"> Using static mockData.json file</span>
                        )}
                        {dataSource === 'none' && (
                            <span className="text-warning"> No data available</span>
                        )}
                    </small>
                    <br />
                    <small className="text-muted">
                        <strong>API Server:</strong>
                        {apiServerStatus === 'checking' && (
                            <span className="text-warning"> Checking...</span>
                        )}
                        {apiServerStatus === 'available' && (
                            <span className="text-success"> Available (automatic file updates enabled)</span>
                        )}
                        {apiServerStatus === 'unavailable' && (
                            // <span className="text-danger"> Unavailable (start with: cd api && npm start - runs on port 5001)</span>
                            <span className="text-danger"> Unavailable (start with: cd api && npm start - runs on port 5000)</span>
                        )}
                    </small>
                </div>

                <Row>
                    <Col md={6}>
                        <h6>Export/Import</h6>
                        <div className="d-flex gap-2 mb-3">
                            <ButtonWithGradient
                                onClick={handleExport}
                                text="Export Mock Data"
                                className="btn-sm"
                            />
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Import Mock Data
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                style={{ display: 'none' }}
                            />
                        </div>
                        <div className="d-flex gap-2">
                            <Button
                                variant="outline-info"
                                size="sm"
                                onClick={handleCopyToClipboard}
                            >
                                Copy & Update File
                            </Button>
                        </div>
                    </Col>

                    <Col md={6}>
                        <h6>Data Management</h6>
                        <div className="d-flex gap-2">
                            <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={handleClearData}
                            >
                                Clear Persistent Data
                            </Button>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={handleReset}
                            >
                                Reset Service
                            </Button>
                        </div>
                    </Col>
                </Row>

                <div className="mt-3">
                    <small className="text-muted">
                        <strong>Note:</strong> In mock mode, data is persisted in localStorage as backup.
                        All CRUD operations automatically save to localStorage. Use export/import to backup or restore your mock data.
                        Use "Copy & Update File" to copy data to clipboard AND automatically update mockData.json via the API server.
                        <br />
                        <strong>API Server:</strong> Make sure the API server is running (cd api && npm start) for automatic file updates.
                    </small>
                </div>
            </Card.Body>
        </Card>
    );
};

export default MockDataManager; 