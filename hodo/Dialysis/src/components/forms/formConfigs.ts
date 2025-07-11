import * as Yup from 'yup';
import type { Patient, ScheduleEntry, Billing, History } from '../../types';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: any;
  colSize?: number;
}

export interface FormConfig {
  fields: FormField[];
  validationSchema: Yup.ObjectSchema<any>;
  initialValues: (data: any) => Record<string, any>;
  title: string;
}

export const patientFormConfig: FormConfig = {
  title: 'Edit Patient',
  fields: [
    { name: 'firstName', label: 'First Name', type: 'text', required: true, colSize: 6 },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true, colSize: 6 },
    { name: 'gender', label: 'Gender', type: 'select', required: true, colSize: 6, options: [
      { value: 'Male', label: 'Male' },
      { value: 'Female', label: 'Female' },
      { value: 'Other', label: 'Other' }
    ] },
    { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, colSize: 6 },
    { name: 'mobileNo', label: 'Mobile Number', type: 'tel', placeholder: '10 digit mobile number', required: true, colSize: 6 },
    { name: 'bloodGroup', label: 'Blood Group', type: 'select', required: true, colSize: 6, options: [
      { value: 'A+', label: 'A+' },
      { value: 'A-', label: 'A-' },
      { value: 'B+', label: 'B+' },
      { value: 'B-', label: 'B-' },
      { value: 'AB+', label: 'AB+' },
      { value: 'AB-', label: 'AB-' },
      { value: 'O+', label: 'O+' },
      { value: 'O-', label: 'O-' }
    ] },
    { name: 'catheterInsertionDate', label: 'Catheter Insertion Date', type: 'date', required: true, colSize: 6 },
    { name: 'fistulaCreationDate', label: 'Fistula Creation Date', type: 'date', required: true, colSize: 6 },
  ],
  validationSchema: Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    gender: Yup.string().required('Gender is required'),
    dateOfBirth: Yup.date().required('Date of birth is required'),
    mobileNo: Yup.string().matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits').required('Mobile number is required'),
    bloodGroup: Yup.string().required('Blood group is required'),
    catheterInsertionDate: Yup.date().required('Catheter insertion date is required'),
    fistulaCreationDate: Yup.date().required('Fistula creation date is required'),
  }),
  initialValues: (data: Patient) => ({
    firstName: data.firstName || data.name || '',
    lastName: data.lastName || '',
    gender: data.gender || '',
    dateOfBirth: data.dateOfBirth || '',
    mobileNo: data.mobileNo || data.phone || '',
    bloodGroup: data.bloodGroup || '',
    catheterInsertionDate: data.catheterInsertionDate || data.catheterDate || '',
    fistulaCreationDate: data.fistulaCreationDate || data.fistulaDate || '',
  })
};

export const appointmentFormConfig: FormConfig = {
  title: 'Edit Appointment',
  fields: [
    { name: 'patientName', label: 'Patient Name', type: 'text', required: true, colSize: 6 },
    { name: 'date', label: 'Date', type: 'date', required: true, colSize: 6 },
    { name: 'time', label: 'Time', type: 'text', placeholder: 'HH:MM', required: true, colSize: 6 },
    { name: 'dialysisUnit', label: 'Dialysis Unit', type: 'text', required: true, colSize: 6 },
    { name: 'admittingDoctor', label: 'Admitting Doctor', type: 'text', required: true, colSize: 6 },
    { name: 'status', label: 'Status', type: 'select', required: true, colSize: 6, options: [
      { value: 'Scheduled', label: 'Scheduled' },
      { value: 'Completed', label: 'Completed' },
      { value: 'Cancelled', label: 'Cancelled' },
      { value: 'No Show', label: 'No Show' }
    ] },
    { name: 'remarks', label: 'Remarks', type: 'textarea', placeholder: 'Additional notes or remarks', colSize: 12 },
  ],
  validationSchema: Yup.object({
    patientName: Yup.string().required('Patient name is required'),
    date: Yup.date().required('Date is required'),
    time: Yup.string().required('Time is required'),
    dialysisUnit: Yup.string().required('Dialysis unit is required'),
    // admittingDoctor: Yup.string().required('Admitting doctor is required'),
    status: Yup.string().required('Status is required'),
    remarks: Yup.string(),
  }),
  initialValues: (data: ScheduleEntry) => ({
    patientName: data.patientName || '',
    date: data.date || '',
    time: data.time || '',
    dialysisUnit: data.dialysisUnit || '',
    // admittingDoctor: data.admittingDoctor || '',
    status: data.status || 'Scheduled',
    remarks: data.remarks || '',
  })
};

export const billingFormConfig: FormConfig = {
  title: 'Edit Bill',
  fields: [
    { name: 'patientName', label: 'Patient Name', type: 'text', required: true, colSize: 6 },
    { name: 'sessionDate', label: 'Session Date', type: 'date', required: true, colSize: 6 },
    { name: 'sessionDuration', label: 'Session Duration (hours)', type: 'number', required: true, colSize: 6 },
    { name: 'totalAmount', label: 'Total Amount', type: 'number', required: true, colSize: 6 },
    { name: 'status', label: 'Status', type: 'select', required: true, colSize: 6, options: [
      { value: 'PAID', label: 'Paid' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'CANCELLED', label: 'Cancelled' }
    ] },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Session description or notes', colSize: 12 },
  ],
  validationSchema: Yup.object({
    patientName: Yup.string().required('Patient name is required'),
    sessionDate: Yup.date().required('Session date is required'),
    sessionDuration: Yup.number().min(0, 'Duration must be positive').required('Session duration is required'),
    totalAmount: Yup.number().min(0, 'Amount must be positive').required('Total amount is required'),
    status: Yup.string().required('Status is required'),
    description: Yup.string(),
  }),
  initialValues: (data: Billing) => ({
    patientName: data.patientName || '',
    sessionDate: data.sessionDate || data.date || '',
    sessionDuration: data.sessionDuration || 0,
    totalAmount: data.totalAmount || data.amount || 0,
    status: data.status || 'PENDING',
    description: data.description || '',
  })
};

export const historyFormConfig: FormConfig = {
  title: 'Edit History Record',
  fields: [
    { name: 'patientName', label: 'Patient Name', type: 'text', required: true, colSize: 6 },
    { name: 'date', label: 'Date', type: 'date', required: true, colSize: 6 },
    // { name: 'parameters', label: 'Parameters', type: 'textarea', placeholder: 'BP, Weight, etc.', required: true, colSize: 6 },
    // { name: 'amount', label: 'Amount', type: 'text', placeholder: 'Session cost', colSize: 6 },
    // { name: 'age', label: 'Age', type: 'text', colSize: 6 },
    // { name: 'gender', label: 'Gender', type: 'select', colSize: 6, options: [
    //   { value: 'Male', label: 'Male' },
    //   { value: 'Female', label: 'Female' },
    //   { value: 'Other', label: 'Other' }
    // ] },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Session notes', colSize: 12 },
    { name: 'nursingNotes', label: 'Nursing Notes', type: 'textarea', placeholder: 'Nursing observations', colSize: 12 },
  ],
  validationSchema: Yup.object({
    patientName: Yup.string().required('Patient name is required'),
    date: Yup.date().required('Date is required'),
    // parameters: Yup.string().required('Parameters are required'),
    // amount: Yup.string(),
    // age: Yup.string(),
    // gender: Yup.string(),
    notes: Yup.string(),
    nursingNotes: Yup.string(),
  }),
  initialValues: (data: History) => ({
    patientName: data.patientName || '',
    date: data.date || '',
    // parameters: data.parameters || '',
    // amount: data.amount || '',
    // age: data.age || '',
    // gender: data.gender || '',
    notes: data.notes || '',
    nursingNotes: data.nursingNotes || '',
  })
}; 