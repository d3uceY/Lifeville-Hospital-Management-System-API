/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       properties:
 *         patient_id:
 *           type: integer
 *           description: Unique patient identifier
 *         date:
 *           type: string
 *           format: date
 *           description: Registration date
 *         hospital_number:
 *           type: integer
 *           description: Hospital number
 *         first_name:
 *           type: string
 *           description: Patient's first name
 *         other_names:
 *           type: string
 *           description: Patient's other names
 *         surname:
 *           type: string
 *           description: Patient's surname
 *         sex:
 *           type: string
 *           description: Patient's sex
 *         marital_status:
 *           type: string
 *           description: Marital status
 *         date_of_birth:
 *           type: string
 *           format: date
 *           description: Date of birth
 *         phone_number:
 *           type: string
 *           description: Contact phone number
 *         address:
 *           type: string
 *           description: Residential address
 *         occupation:
 *           type: string
 *           description: Patient's occupation
 *         place_of_work_address:
 *           type: string
 *           description: Work address
 *         religion:
 *           type: string
 *           description: Religious affiliation
 *         nationality:
 *           type: string
 *           description: Nationality
 *         next_of_kin:
 *           type: string
 *           description: Next of kin name
 *         relationship:
 *           type: string
 *           description: Relationship to next of kin
 *         next_of_kin_phone:
 *           type: string
 *           description: Next of kin phone number
 *         next_of_kin_address:
 *           type: string
 *           description: Next of kin address
 *         past_surgical_history:
 *           type: string
 *           description: Past surgical history
 *         family_history:
 *           type: string
 *           description: Family medical history
 *         social_history:
 *           type: string
 *           description: Social history
 *         drug_history:
 *           type: string
 *           description: Drug history
 *         allergies:
 *           type: string
 *           description: Known allergies
 *         dietary_restrictions:
 *           type: string
 *           description: Dietary restrictions
 *         diet_allergies_to_drugs:
 *           type: string
 *           description: Drug allergies
 *         past_medical_history:
 *           type: string
 *           description: Past medical history
 *         patient_type:
 *           type: string
 *           enum: [INPATIENT, OUTPATIENT, NULL]
 *           description: Type of patient
 *         is_inpatient:
 *           type: boolean
 *           description: Whether patient is currently admitted
 *     PatientInput:
 *       type: object
 *       required:
 *         - date
 *         - hospital_number
 *         - first_name
 *         - sex
 *         - date_of_birth
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           description: Registration date
 *         hospital_number:
 *           type: integer
 *           description: Hospital number
 *         first_name:
 *           type: string
 *           description: Patient's first name
 *         other_names:
 *           type: string
 *           description: Patient's other names
 *         surname:
 *           type: string
 *           description: Patient's surname
 *         sex:
 *           type: string
 *           description: Patient's sex
 *         marital_status:
 *           type: string
 *           description: Marital status
 *         date_of_birth:
 *           type: string
 *           format: date
 *           description: Date of birth
 *         phone_number:
 *           type: string
 *           description: Contact phone number
 *         address:
 *           type: string
 *           description: Residential address
 *         occupation:
 *           type: string
 *           description: Patient's occupation
 *         place_of_work_address:
 *           type: string
 *           description: Work address
 *         religion:
 *           type: string
 *           description: Religious affiliation
 *         nationality:
 *           type: string
 *           description: Nationality
 *         next_of_kin:
 *           type: string
 *           description: Next of kin name
 *         relationship:
 *           type: string
 *           description: Relationship to next of kin
 *         next_of_kin_phone:
 *           type: string
 *           description: Next of kin phone number
 *         next_of_kin_address:
 *           type: string
 *           description: Next of kin address
 *         past_surgical_history:
 *           type: string
 *           description: Past surgical history
 *         family_history:
 *           type: string
 *           description: Family medical history
 *         social_history:
 *           type: string
 *           description: Social history
 *         drug_history:
 *           type: string
 *           description: Drug history
 *         allergies:
 *           type: string
 *           description: Known allergies
 *         dietary_restrictions:
 *           type: string
 *           description: Dietary restrictions
 *         diet_allergies_to_drugs:
 *           type: string
 *           description: Drug allergies
 *         past_medical_history:
 *           type: string
 *           description: Past medical history
 *         patient_type:
 *           type: string
 *           enum: [INPATIENT, OUTPATIENT, NULL]
 *           description: Type of patient
 *         is_inpatient:
 *           type: boolean
 *           description: Whether patient is currently admitted
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
