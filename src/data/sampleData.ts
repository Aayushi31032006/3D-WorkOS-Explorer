import { BusinessObject, ObjectType } from '../types';

export interface RelationshipConnection {
  fromId: string;
  toId: string;
  relationshipName: string;
}

const relationshipNameFor = (fromId: string, toId: string): string => {
  const from = BASE_OBJECTS[fromId]?.type;
  const to = BASE_OBJECTS[toId]?.type;
  if (from === 'customer' && to === 'invoice') return 'customer invoices';
  if (from === 'customer' && to === 'project') return 'customer projects';
  if (from === 'customer' && to === 'person') return 'customer contacts';
  if (from === 'customer' && to === 'product') return 'customer products';
  if (from === 'customer' && to === 'contract') return 'customer contracts';
  if (from === 'invoice' && to === 'project') return 'linked project';
  if (from === 'invoice' && to === 'payment') return 'invoice payment';
  if (from === 'invoice' && to === 'task') return 'invoice task';
  if (from === 'project' && to === 'task') return 'project task';
  if (from === 'project' && to === 'person') return 'project contact';
  if (from === 'product' && to === 'project') return 'product project';
  if (from === 'task' && to === 'person') return 'task assignee';
  if (from === 'customer' && to === 'payment') return 'customer payment';
  if (from === 'customer' && to === 'customer') return 'related customer';
  return `${from || 'record'} connection`;
};

// Canonical Base Objects
export const BASE_OBJECTS: Record<string, BusinessObject> = {
  cust_globex: {
    id: 'cust_globex',
    companyId: 'company_globex',
    type: 'customer',
    name: 'Globex Ltd',
    owner: 'Eleanor Vance',
    status: 'Active',
    createdDate: '12 January 2024',
    description: 'Global industrial automation, cyber-physical infrastructure, and enterprise robotics platform.',
    activity: [
      { id: 'act_1', date: '28 Oct', description: 'Quarterly enterprise governance review completed' },
      { id: 'act_2', date: '25 Oct', description: 'Enterprise platform subscription renewed for 2027' },
      { id: 'act_3', date: '20 Oct', description: 'Primary contact assigned: Sarah Connor' }
    ]
  },

  inv_0041: {
    id: 'inv_0041',
    companyId: 'company_globex',
    type: 'invoice',
    name: 'INV-0041',
    code: 'INV-0041',
    amount: '₹18,000',
    status: 'Paid',
    dueDate: '15 October 2026',
    createdDate: '15 September 2026',
    owner: 'Eleanor Vance',
    activity: [{ id: 'act_6', date: '15 Oct', description: 'Marked as paid via wire transfer' }]
  },

  inv_0042: {
    id: 'inv_0042',
    companyId: 'company_globex',
    type: 'invoice',
    name: 'INV-0042',
    code: 'INV-0042',
    amount: '₹42,500',
    status: 'Due',
    dueDate: '30 October 2026',
    createdDate: '22 October 2026',
    owner: 'Eleanor Vance',
    activity: [
      { id: 'act_4', date: '23 Oct', description: 'Due date updated to 30 October' },
      { id: 'act_5', date: '22 Oct', description: 'Invoice created' }
    ]
  },

  inv_0043: {
    id: 'inv_0043',
    companyId: 'company_globex',
    type: 'invoice',
    name: 'INV-0043',
    code: 'INV-0043',
    amount: '₹65,000',
    status: 'Draft',
    dueDate: '15 November 2026',
    createdDate: '24 October 2026',
    owner: 'Marcus Aurelius',
    activity: [{ id: 'act_7', date: '24 Oct', description: 'Draft generated from timesheet' }]
  },

  inv_0044: {
    id: 'inv_0044',
    companyId: 'company_globex',
    type: 'invoice',
    name: 'INV-0044',
    code: 'INV-0044',
    amount: '₹32,400',
    status: 'Due',
    dueDate: '05 November 2026',
    createdDate: '18 October 2026',
    owner: 'Eleanor Vance',
    activity: [{ id: 'act_44', date: '18 Oct', description: 'Generated for milestone review' }]
  },

  inv_0045: {
    id: 'inv_0045',
    companyId: 'company_globex',
    type: 'invoice',
    name: 'INV-0045',
    code: 'INV-0045',
    amount: '₹12,800',
    status: 'Paid',
    dueDate: '01 October 2026',
    createdDate: '01 September 2026',
    owner: 'Eleanor Vance',
    activity: [{ id: 'act_45', date: '01 Oct', description: 'Settled by corporate wire' }]
  },

  inv_0046: {
    id: 'inv_0046',
    companyId: 'company_globex',
    type: 'invoice',
    name: 'INV-0046',
    code: 'INV-0046',
    amount: '₹94,000',
    status: 'Due',
    dueDate: '20 November 2026',
    createdDate: '20 October 2026',
    owner: 'Eleanor Vance',
    activity: [{ id: 'act_46', date: '20 Oct', description: 'Invoice issued for Phase 1 telemetry' }]
  },

  inv_0047: {
    id: 'inv_0047',
    companyId: 'company_globex',
    type: 'invoice',
    name: 'INV-0047',
    code: 'INV-0047',
    amount: '₹51,200',
    status: 'Paid',
    dueDate: '28 September 2026',
    createdDate: '28 August 2026',
    owner: 'Marcus Aurelius',
    activity: [{ id: 'act_47', date: '28 Sep', description: 'Paid via automated clearance' }]
  },

  proj_alpha: {
    id: 'proj_alpha',
    companyId: 'company_globex',
    type: 'project',
    name: 'Project Alpha',
    owner: 'Marcus Aurelius',
    status: 'In Progress',
    dueDate: '15 December 2026',
    createdDate: '01 August 2026',
    description: 'Autonomous robotics orchestration engine for next-gen smart manufacturing pipelines.',
    activity: [
      { id: 'act_8', date: '29 Oct', description: 'Sprint 14 review completed' },
      { id: 'act_9', date: '19 Oct', description: 'Prototype validated with Globex QA' }
    ]
  },

  proj_beta: {
    id: 'proj_beta',
    companyId: 'company_globex',
    type: 'project',
    name: 'Project Beta',
    owner: 'Eleanor Vance',
    status: 'Planning',
    dueDate: '30 March 2027',
    createdDate: '10 October 2026',
    description: 'Supply chain sensor telemetry mesh integration with WorkOS cloud ERP.',
    activity: [
      { id: 'act_beta_1', date: '27 Oct', description: 'Initial architecture blueprint signed' }
    ]
  },

  task_proposal: {
    id: 'task_proposal',
    companyId: 'company_globex',
    type: 'task',
    name: 'Prepare proposal',
    owner: 'Sarah Connor',
    status: 'In Review',
    dueDate: '02 November 2026',
    createdDate: '26 October 2026',
    description: 'Finalize technical scope, SLA definitions and rate card for Phase 2 expansion.',
    activity: [
      { id: 'act_10', date: '27 Oct', description: 'Legal annex attached' },
      { id: 'act_11', date: '26 Oct', description: 'Task assigned to Sarah Connor' }
    ]
  },

  task_arch_review: {
    id: 'task_arch_review',
    companyId: 'company_globex',
    type: 'task',
    name: 'Architecture review',
    owner: 'Marcus Aurelius',
    status: 'Completed',
    dueDate: '20 October 2026',
    createdDate: '10 October 2026',
    activity: [
      { id: 'act_arch_1', date: '20 Oct', description: 'Architecture sign-off granted' }
    ]
  },

  task_security_signoff: {
    id: 'task_security_signoff',
    companyId: 'company_globex',
    type: 'task',
    name: 'Security sign-off',
    owner: 'Sarah Connor',
    status: 'In Progress',
    dueDate: '08 November 2026',
    createdDate: '24 October 2026',
    activity: [
      { id: 'act_sec_1', date: '25 Oct', description: 'Penetration test report reviewed' }
    ]
  },

  task_beta_scoping: {
    id: 'task_beta_scoping',
    companyId: 'company_globex',
    type: 'task',
    name: 'Mesh telemetry scoping',
    owner: 'Miles Dyson',
    status: 'In Progress',
    dueDate: '18 November 2026',
    createdDate: '25 October 2026',
    activity: [
      { id: 'act_scope_1', date: '28 Oct', description: 'Sensor bandwidth requirements modeled' }
    ]
  },

  person_sarah: {
    id: 'person_sarah',
    companyId: 'company_globex',
    type: 'person',
    name: 'Sarah Connor',
    owner: 'Globex Ltd',
    status: 'Primary Contact',
    description: 'Vice President of Technology & Infrastructure at Globex Ltd.',
    activity: [{ id: 'act_12', date: '18 Oct', description: 'Quarterly roadmap aligned' }]
  },

  person_miles: {
    id: 'person_miles',
    companyId: 'company_globex',
    type: 'person',
    name: 'Miles Dyson',
    owner: 'Globex Ltd',
    status: 'Principal Architect',
    description: 'Lead Distributed Systems Architect for Industrial Telemetry.',
    activity: [{ id: 'act_miles_1', date: '15 Oct', description: 'Advisory session completed' }]
  },

  prod_cloud: {
    id: 'prod_cloud',
    companyId: 'company_globex',
    type: 'product',
    name: 'Enterprise Cloud Platform',
    status: 'Active Subscription',
    activity: [{ id: 'act_prod_1', date: '01 Oct', description: 'Platform update v4.2 rolled out' }]
  },

  prod_telemetry: {
    id: 'prod_telemetry',
    companyId: 'company_globex',
    type: 'product',
    name: 'Edge Telemetry Gateway',
    status: 'Deployed',
    activity: [{ id: 'act_prod_2', date: '12 Sep', description: 'Edge nodes certified' }]
  },

  pay_9011: {
    id: 'pay_9011',
    companyId: 'company_globex',
    type: 'payment',
    name: 'PAY-9011',
    amount: '₹42,500',
    status: 'Pending Authorization',
    activity: [{ id: 'act_pay_1', date: '23 Oct', description: 'Wire transfer scheduled' }]
  },

  pay_9012: {
    id: 'pay_9012',
    companyId: 'company_globex',
    type: 'payment',
    name: 'PAY-9012',
    amount: '₹65,000',
    status: 'Settled',
    activity: [{ id: 'act_pay_2', date: '25 Oct', description: 'Cleared by reserve bank' }]
  },

  pay_9013: {
    id: 'pay_9013',
    companyId: 'company_globex',
    type: 'payment',
    name: 'PAY-9013',
    amount: '₹32,400',
    status: 'Processing',
    activity: [{ id: 'act_pay_3', date: '19 Oct', description: 'Processing batch clearance' }]
  },

  pay_9014: {
    id: 'pay_9014',
    companyId: 'company_globex',
    type: 'payment',
    name: 'PAY-9014',
    amount: '₹12,800',
    status: 'Settled',
    activity: [{ id: 'act_pay_4', date: '02 Oct', description: 'Direct debit confirmed' }]
  },

  pay_9015: {
    id: 'pay_9015',
    companyId: 'company_globex',
    type: 'payment',
    name: 'PAY-9015',
    amount: '₹94,000',
    status: 'In Escrow',
    activity: [{ id: 'act_pay_5', date: '21 Oct', description: 'Escrow account funded' }]
  },

  pay_9016: {
    id: 'pay_9016',
    companyId: 'company_globex',
    type: 'payment',
    name: 'PAY-9016',
    amount: '₹51,200',
    status: 'Settled',
    activity: [{ id: 'act_pay_6', date: '29 Sep', description: 'Settlement receipt issued' }]
  },

  contract_master: {
    id: 'contract_master',
    companyId: 'company_globex',
    type: 'contract',
    name: 'Master Services Agreement 2026',
    status: 'Executed',
    activity: [{ id: 'act_c1', date: '01 Jan', description: 'Executed by Eleanor Vance' }]
  },

  contract_sla: {
    id: 'contract_sla',
    companyId: 'company_globex',
    type: 'contract',
    name: '99.99% Availability SLA Addendum',
    status: 'Active',
    activity: [{ id: 'act_c2', date: '01 Feb', description: 'SLA schedule enacted' }]
  },

  record_restricted: {
    id: 'record_restricted',
    companyId: 'company_globex',
    type: 'contract',
    name: 'Confidential M&A Acquisition Annex',
    restricted: true,
    status: 'Restricted'
  },

  // Initech baseline records
  cust_initech: {
    id: 'cust_initech',
    companyId: 'company_initech',
    type: 'customer',
    name: 'Initech Corporation',
    owner: 'Bill Lumbergh',
    status: 'Active',
    createdDate: '15 March 2022',
    description: 'Financial accounting software & document compliance consultancy.',
    activity: [{ id: 'act_ini_1', date: '29 Oct', description: 'TPS report format updated' }]
  },

  inv_initech_9001: {
    id: 'inv_initech_9001',
    companyId: 'company_initech',
    type: 'invoice',
    name: 'INV-9001',
    code: 'INV-9001',
    amount: '$14,200',
    status: 'Paid',
    dueDate: '20 October 2026',
    owner: 'Bill Lumbergh',
    activity: [{ id: 'act_ini_inv', date: '20 Oct', description: 'Payment recorded' }]
  },

  proj_phoenix: {
    id: 'proj_phoenix',
    companyId: 'company_initech',
    type: 'project',
    name: 'Project Phoenix',
    owner: 'Peter Gibbons',
    status: 'In Progress',
    dueDate: '30 November 2026',
    activity: [{ id: 'act_ini_proj', date: '15 Oct', description: 'System migration kickoff' }]
  }
};

/**
 * Baseline canonical relationships declared once (bi-directional derivation handled by localDatabase).
 * Customer (Globex Ltd) has Invoices (7), Projects (2), Contacts (2), Tasks (3), Products (2), Contracts (3), Payments (0 directly or derived via invoices).
 */
const RAW_BASE_RELATIONSHIPS: Omit<RelationshipConnection, 'relationshipName'>[] = [
  // Globex Customer <-> Invoices (7)
  { fromId: 'cust_globex', toId: 'inv_0041' },
  { fromId: 'cust_globex', toId: 'inv_0042' },
  { fromId: 'cust_globex', toId: 'inv_0043' },
  { fromId: 'cust_globex', toId: 'inv_0044' },
  { fromId: 'cust_globex', toId: 'inv_0045' },
  { fromId: 'cust_globex', toId: 'inv_0046' },
  { fromId: 'cust_globex', toId: 'inv_0047' },

  // Globex Customer <-> Projects
  { fromId: 'cust_globex', toId: 'proj_alpha' },
  { fromId: 'cust_globex', toId: 'proj_beta' },

  // Globex Customer <-> Contacts (People)
  { fromId: 'cust_globex', toId: 'person_sarah' },
  { fromId: 'cust_globex', toId: 'person_miles' },

  // Globex Customer <-> Products
  { fromId: 'cust_globex', toId: 'prod_cloud' },
  { fromId: 'cust_globex', toId: 'prod_telemetry' },

  // Globex Customer <-> Contracts (including restricted)
  { fromId: 'cust_globex', toId: 'contract_master' },
  { fromId: 'cust_globex', toId: 'contract_sla' },
  { fromId: 'cust_globex', toId: 'record_restricted' },

  // Invoices <-> Projects (Notice: INV-0043 links to proj_beta!)
  { fromId: 'inv_0041', toId: 'proj_alpha' },
  { fromId: 'inv_0042', toId: 'proj_alpha' },
  { fromId: 'inv_0043', toId: 'proj_beta' },
  { fromId: 'inv_0044', toId: 'proj_alpha' },
  { fromId: 'inv_0045', toId: 'proj_alpha' },
  { fromId: 'inv_0046', toId: 'proj_beta' },
  { fromId: 'inv_0047', toId: 'proj_beta' },

  // Invoices <-> Payments
  { fromId: 'inv_0041', toId: 'pay_9011' },
  { fromId: 'inv_0042', toId: 'pay_9011' },
  { fromId: 'inv_0043', toId: 'pay_9012' },
  { fromId: 'inv_0044', toId: 'pay_9013' },
  { fromId: 'inv_0045', toId: 'pay_9014' },
  { fromId: 'inv_0046', toId: 'pay_9015' },
  { fromId: 'inv_0047', toId: 'pay_9016' },

  // Invoices <-> Tasks
  { fromId: 'inv_0042', toId: 'task_proposal' },
  { fromId: 'inv_0042', toId: 'task_security_signoff' },
  { fromId: 'inv_0041', toId: 'task_arch_review' },
  { fromId: 'inv_0043', toId: 'task_beta_scoping' },
  { fromId: 'inv_0044', toId: 'task_proposal' },
  { fromId: 'inv_0045', toId: 'task_arch_review' },
  { fromId: 'inv_0046', toId: 'task_beta_scoping' },
  { fromId: 'inv_0047', toId: 'task_beta_scoping' },

  // Projects <-> Tasks
  { fromId: 'proj_alpha', toId: 'task_proposal' },
  { fromId: 'proj_alpha', toId: 'task_arch_review' },
  { fromId: 'proj_alpha', toId: 'task_security_signoff' },
  { fromId: 'proj_beta', toId: 'task_beta_scoping' },

  // Projects <-> Contacts
  { fromId: 'proj_alpha', toId: 'person_sarah' },
  { fromId: 'proj_beta', toId: 'person_miles' },

  // Products <-> Projects
  { fromId: 'prod_cloud', toId: 'proj_alpha' },
  { fromId: 'prod_telemetry', toId: 'proj_beta' },

  // Tasks <-> People (Assignees)
  { fromId: 'task_proposal', toId: 'person_sarah' },
  { fromId: 'task_arch_review', toId: 'person_miles' },
  { fromId: 'task_security_signoff', toId: 'person_sarah' },
  { fromId: 'task_beta_scoping', toId: 'person_miles' },

  // Initech links
  { fromId: 'cust_initech', toId: 'inv_initech_9001' },
  { fromId: 'cust_initech', toId: 'proj_phoenix' },
  { fromId: 'inv_initech_9001', toId: 'proj_phoenix' }
];

export const BASE_RELATIONSHIPS: RelationshipConnection[] = RAW_BASE_RELATIONSHIPS.map(connection => ({
  ...connection,
  relationshipName: relationshipNameFor(connection.fromId, connection.toId)
}));

/**
 * Generate enough additional invoices to make 1,000 total invoices, beginning
 * at inv_0048 and preserving the same stable ID format as the base records.
 */
export function generate1000InvoicesDataset(): {
  objects: Record<string, BusinessObject>;
  relationships: RelationshipConnection[];
} {
  const extraObjects: Record<string, BusinessObject> = {};
  const extraRelationships: RelationshipConnection[] = [];
  const statuses = ['Paid', 'Due', 'Draft', 'Pending Approval'];
  const projects = ['proj_alpha', 'proj_beta'];

  for (let i = 48; i <= 1040; i++) {
    const num = String(i).padStart(4, '0');
    const id = `inv_${num}`;
    const code = `INV-${num}`;
    const status = statuses[i % statuses.length];
    const targetProject = projects[i % projects.length];

    extraObjects[id] = {
      id,
      companyId: 'company_globex',
      type: 'invoice',
      name: code,
      code,
      amount: `₹${((i * 17) % 850 + 100) * 100}`,
      status,
      dueDate: `${(i % 28) + 1} November 2026`,
      createdDate: '15 October 2026',
      owner: i % 2 === 0 ? 'Eleanor Vance' : 'Marcus Aurelius',
      activity: [
        { id: `act_${id}`, date: `${(i % 25) + 1} Oct`, description: `Transaction recorded for ${code}` }
      ]
    };

    // Link invoice to customer
    extraRelationships.push({
      fromId: 'cust_globex',
      toId: id,
      relationshipName: 'customer invoices'
    });
    // Link invoice to project
    extraRelationships.push({
      fromId: id,
      toId: targetProject,
      relationshipName: 'linked project'
    });
    // Link invoice to a payment
    const paymentId = (i % 2 === 0) ? 'pay_9011' : 'pay_9012';
    extraRelationships.push({
      fromId: id,
      toId: paymentId,
      relationshipName: 'invoice payment'
    });
  }

  return { objects: extraObjects, relationships: extraRelationships };
}
