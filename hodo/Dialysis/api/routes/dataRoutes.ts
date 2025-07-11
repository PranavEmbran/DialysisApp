import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { generatePatientId } from '../utils/patientIdGenerator';
import { updatePatientNameReferences } from '../db/dbOperations';
import {
  getPatients,
  addPatient,
  deletePatient,
  restorePatient,
  getBilling,
  addBilling,
  updateBilling,
  deleteBilling,
  softDeleteBilling,
  getHistory,
  addHistory,
  updateHistory,
  deleteHistory,
  softDeleteHistory
} from '../controllers/dataController';

const router = express.Router();

// Database file path
const dbPath = path.join(__dirname, '../db/db.json');

// Helper function to read database
const readDatabase = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { patients: [], appointments: [], billing: [], history: [], dialysisFlowCharts: [], haemodialysisRecords: [] };
  }
};

// Helper function to write database
const writeDatabase = (data: any) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
};

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' });
});

// Debug endpoint to check database path and working directory
router.get('/debug', (req: Request, res: Response) => {
  res.json({
    message: 'Debug info',
    dbPath: dbPath,
    workingDirectory: process.cwd(),
    fileExists: fs.existsSync(dbPath),
    fileStats: fs.existsSync(dbPath) ? fs.statSync(dbPath) : null
  });
});

// Patients endpoints
router.get('/patients', getPatients);

router.post('/patients', addPatient);

// Get patient by ID
router.get('/patients/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    const patient = db.patients.find((p: any) => p.id === id);
    if (patient) {
      res.json(patient);
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Update patient by ID
router.put('/patients/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    const index = db.patients.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      // Always compute the name field from firstName and lastName
      const updatedPatient = {
        ...db.patients[index],
        ...req.body,
        id: id, // Ensure ID is preserved
        name: `${req.body.firstName || db.patients[index].firstName || ''} ${req.body.lastName || db.patients[index].lastName || ''}`.trim()
      };
      db.patients[index] = updatedPatient;

      // Compute the new full name for patientName
      const newPatientName = `${updatedPatient.firstName || ''} ${updatedPatient.lastName || ''}`.trim();

      // Update patientName in all related tables using the utility function
      updatePatientNameReferences(id, newPatientName, db);

      // Save the updated database
      writeDatabase(db);

      res.json(updatedPatient);
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete patient by ID (soft delete)
router.delete('/patients/:id', deletePatient);

// Restore soft-deleted patient
router.post('/patients/:id/restore', restorePatient);

// Billing endpoints
router.get('/billing', getBilling);

router.post('/billing', addBilling);

// Update billing by ID
router.put('/billing/:id', updateBilling);

// Delete billing by ID (hard delete)
router.delete('/billing/:id', deleteBilling);

// Soft delete billing by ID
router.patch('/billing/:id/soft-delete', softDeleteBilling);

// History endpoints
router.get('/history', getHistory);

router.post('/history', addHistory);

// Update history by ID
router.put('/history/:id', updateHistory);

// Delete history by ID (hard delete)
router.delete('/history/:id', deleteHistory);

// Soft delete history by ID
router.patch('/history/:id/soft-delete', softDeleteHistory);

// Schedule endpoints (appointments)
router.get('/schedule', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    // Filter out soft-deleted appointments
    const activeAppointments = (db.appointments || []).filter((apt: any) => apt.isDeleted !== 0);
    res.json(activeAppointments);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Add the /schedules endpoint (plural) for frontend compatibility
router.get('/schedules', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    // Filter out soft-deleted appointments
    const activeAppointments = (db.appointments || []).filter((apt: any) => apt.isDeleted !== 0);
    res.json(activeAppointments);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

router.post('/schedule', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    const schedule = {
      ...req.body,
      id: Date.now().toString(),
      status: req.body.status || 'Scheduled', // Set default status if not provided
      isDeleted: 10 // Ensure isDeleted is always set
    };
    db.appointments.push(schedule);
    writeDatabase(db);
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error adding schedule:', error);
    res.status(500).json({ error: 'Failed to add schedule' });
  }
});

// Add or update the POST /schedules endpoint
router.post('/schedules', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    const schedule = {
      ...req.body,
      id: Date.now().toString(),
      status: req.body.status || 'Scheduled', // Set default status if not provided
      isDeleted: 10 // Ensure isDeleted is always set
    };
    db.appointments.push(schedule);
    writeDatabase(db);
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error adding schedule:', error);
    res.status(500).json({ error: 'Failed to add schedule' });
  }
});

// Get appointment by ID
router.get('/appointments/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    const appointment = db.appointments.find((a: any) => a.id === id && a.isDeleted !== 0);
    if (appointment) {
      res.json(appointment);
    } else {
      res.status(404).json({ error: 'Appointment not found' });
    }
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Update appointment by ID
router.put('/appointments/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    const index = db.appointments.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      // Update the appointment data while preserving the ID
      const updatedAppointment = {
        ...db.appointments[index],
        ...req.body,
        id: id // Ensure ID is preserved
      };

      db.appointments[index] = updatedAppointment;
      writeDatabase(db);

      res.json(updatedAppointment);
    } else {
      res.status(404).json({ error: 'Appointment not found' });
    }
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Soft delete appointment by ID
router.patch('/appointments/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    const index = db.appointments.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      // Soft delete - mark as deleted instead of removing
      db.appointments[index] = {
        ...db.appointments[index],
        isDeleted: 0,
        deletedAt: new Date().toISOString()
      };

      writeDatabase(db);
      res.json({ message: `Appointment ${id} soft deleted successfully` });
    } else {
      res.status(404).json({ error: 'Appointment not found' });
    }
  } catch (error) {
    console.error('Error soft deleting appointment:', error);
    res.status(500).json({ error: 'Failed to soft delete appointment' });
  }
});

// Delete appointment by ID
router.delete('/appointments/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    const index = db.appointments.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      db.appointments.splice(index, 1);
      writeDatabase(db);
      res.json({ message: `Appointment ${id} deleted successfully` });
    } else {
      res.status(404).json({ error: 'Appointment not found' });
    }
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// Staff endpoint
router.get('/staff', (req: Request, res: Response) => {
  try {
    // Mock staff data - you can move this to db.json later
    const staffData = {
      technicians: [
        "Dr. Smith",
        "Dr. Brown",
        "Dr. Wilson",
        "Dr. Davis",
        "Dr. Miller"
      ],
      doctors: [
        "Dr. Johnson",
        "Dr. Williams",
        "Dr. Davis",
        "Dr. Miller",
        "Dr. Garcia"
      ],
      units: [
        "Unit A",
        "Unit B",
        "Unit C",
        "Unit D"
      ]
    };
    res.json(staffData);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Dialysis Flow Chart endpoints
router.get('/dialysis-flow-charts', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    res.json(db.dialysisFlowCharts || []);
  } catch (error) {
    console.error('Error fetching dialysis flow charts:', error);
    res.status(500).json({ error: 'Failed to fetch dialysis flow charts' });
  }
});

router.post('/dialysis-flow-charts', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    const dialysisFlowChart = {
      ...req.body,
      id: Date.now().toString()
    };

    db.dialysisFlowCharts.push(dialysisFlowChart);
    writeDatabase(db);

    res.status(201).json(dialysisFlowChart);
  } catch (error) {
    console.error('Error adding dialysis flow chart:', error);
    res.status(500).json({ error: 'Failed to add dialysis flow chart' });
  }
});

router.delete('/dialysis-flow-charts/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    const index = db.dialysisFlowCharts.findIndex((d: any) => d.id === id);
    if (index !== -1) {
      db.dialysisFlowCharts.splice(index, 1);
      writeDatabase(db);
      res.json({ message: `Dialysis flow chart ${id} deleted successfully` });
    } else {
      res.status(404).json({ error: 'Dialysis flow chart not found' });
    }
  } catch (error) {
    console.error('Error deleting dialysis flow chart:', error);
    res.status(500).json({ error: 'Failed to delete dialysis flow chart' });
  }
});

// Haemodialysis Records endpoints
router.get('/haemodialysis-records', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    res.json(db.haemodialysisRecords || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch haemodialysis records' });
  }
});

router.post('/haemodialysis-records', (req: Request, res: Response) => {
  try {
    const db = readDatabase();
    const newRecord = {
      ...req.body,
      id: Date.now().toString()
    };
    db.haemodialysisRecords.push(newRecord);
    writeDatabase(db);
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add haemodialysis record' });
  }
});

// Mock data management endpoint
router.post('/mock-data/update', (req: Request, res: Response): void => {
  try {
    const { data } = req.body;
    
    if (!data) {
      res.status(400).json({ error: 'Data is required' });
      return;
    }

    // Path to mockData.json file
    const mockDataPath = path.join(__dirname, '../../src/mock/mockData.json');
    
    // Write the data to mockData.json
    fs.writeFileSync(mockDataPath, JSON.stringify(data, null, 2));
    
    console.log('✅ Mock data updated successfully via API');
    
    res.json({ 
      message: 'Mock data updated successfully',
      filePath: mockDataPath
    });
  } catch (error) {
    console.error('Error updating mock data:', error);
    res.status(500).json({ error: 'Failed to update mock data' });
  }
});

// Get current mock data
router.get('/mock-data', (req: Request, res: Response) => {
  try {
    const mockDataPath = path.join(__dirname, '../../src/mock/mockData.json');
    
    if (fs.existsSync(mockDataPath)) {
      const data = fs.readFileSync(mockDataPath, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.status(404).json({ error: 'Mock data file not found' });
    }
  } catch (error) {
    console.error('Error reading mock data:', error);
    res.status(500).json({ error: 'Failed to read mock data' });
  }
});

export default router; 