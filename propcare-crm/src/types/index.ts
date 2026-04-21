// ─────────────────────────────────────────────
//  BASE TYPES
// ─────────────────────────────────────────────

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "AGENT";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "PENDING_CLIENT"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketCategory =
  | "MAINTENANCE"
  | "COMPLAINT"
  | "INQUIRY"
  | "PAYMENT"
  | "LEASE"
  | "HANDOVER"
  | "OTHER";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export type PropertyType =
  | "APARTMENT"
  | "VILLA"
  | "TOWNHOUSE"
  | "PENTHOUSE"
  | "STUDIO"
  | "DUPLEX"
  | "COMMERCIAL";

export type PropertyStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "SOLD"
  | "RENTED"
  | "UNDER_MAINTENANCE";

export type InteractionType =
  | "CALL"
  | "EMAIL"
  | "WHATSAPP"
  | "MEETING"
  | "SITE_VISIT"
  | "NOTE";

export type NotificationType =
  | "TICKET_ASSIGNED"
  | "TICKET_UPDATED"
  | "TICKET_RESOLVED"
  | "LEAD_ASSIGNED"
  | "MENTION"
  | "SYSTEM";

// ─────────────────────────────────────────────
//  ENTITY TYPES
// ─────────────────────────────────────────────

export interface User {
  id: string;
  supabaseId: string;
  email: string;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  role: UserRole;
  department?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  code: string;
  name: string;
  email?: string | null;
  phone: string;
  whatsapp?: string | null;
  nationality?: string | null;
  idNumber?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  // Relations
  tickets?: Ticket[];
  leads?: Lead[];
  properties?: ClientProperty[];
  _count?: { tickets: number; leads: number };
}

export interface Property {
  id: string;
  code: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  project?: string | null;
  building?: string | null;
  floor?: number | null;
  unit?: string | null;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  price?: number | null;
  address?: string | null;
  city?: string | null;
  description?: string | null;
  images: string[];
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientProperty {
  id: string;
  clientId: string;
  propertyId: string;
  relation: string;
  since?: Date | null;
  notes?: string | null;
  createdAt: Date;
  client?: Client;
  property?: Property;
}

export interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  clientId?: string | null;
  propertyId?: string | null;
  assignedToId?: string | null;
  createdById: string;
  dueDate?: Date | null;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
  attachments: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  // Relations
  client?: Client | null;
  property?: Property | null;
  assignedTo?: User | null;
  createdBy?: User;
  comments?: TicketComment[];
  _count?: { comments: number };
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface Lead {
  id: string;
  code: string;
  title?: string | null;
  status: LeadStatus;
  source?: string | null;
  budget?: number | null;
  clientId?: string | null;
  propertyId?: string | null;
  assignedToId?: string | null;
  notes?: string | null;
  tags: string[];
  followUpDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  client?: Client | null;
  property?: Property | null;
  assignedTo?: User | null;
  interactions?: Interaction[];
}

export interface Interaction {
  id: string;
  type: InteractionType;
  summary: string;
  details?: string | null;
  duration?: number | null;
  clientId?: string | null;
  leadId?: string | null;
  userId: string;
  scheduledAt?: Date | null;
  createdAt: Date;
  client?: Client | null;
  lead?: Lead | null;
  user?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: Date;
}

// ─────────────────────────────────────────────
//  UI / UTILITY TYPES
// ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  resolvedToday: number;
  avgResolutionHours: number;
  totalClients: number;
  activeLeads: number;
  ticketsByStatus: Record<TicketStatus, number>;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByCategory: Record<TicketCategory, number>;
  ticketsThisWeek: { date: string; count: number }[];
  topAgents: { agent: User; resolved: number; open: number }[];
}

// ─────────────────────────────────────────────
//  LABEL MAPS
// ─────────────────────────────────────────────

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  PENDING_CLIENT: "Pending Client",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  MAINTENANCE: "Maintenance",
  COMPLAINT: "Complaint",
  INQUIRY: "Inquiry",
  PAYMENT: "Payment",
  LEASE: "Lease",
  HANDOVER: "Handover",
  OTHER: "Other",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: "Apartment",
  VILLA: "Villa",
  TOWNHOUSE: "Townhouse",
  PENTHOUSE: "Penthouse",
  STUDIO: "Studio",
  DUPLEX: "Duplex",
  COMMERCIAL: "Commercial",
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  RENTED: "Rented",
  UNDER_MAINTENANCE: "Under Maintenance",
};

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  CALL: "Phone Call",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  MEETING: "Meeting",
  SITE_VISIT: "Site Visit",
  NOTE: "Note",
};

// Badge class helpers
export const TICKET_STATUS_BADGE: Record<TicketStatus, string> = {
  OPEN: "badge badge-open",
  IN_PROGRESS: "badge badge-progress",
  PENDING_CLIENT: "badge badge-progress",
  RESOLVED: "badge badge-resolved",
  CLOSED: "badge badge-closed",
};

export const TICKET_PRIORITY_BADGE: Record<TicketPriority, string> = {
  LOW: "badge badge-low",
  MEDIUM: "badge badge-medium",
  HIGH: "badge badge-high",
  URGENT: "badge badge-urgent",
};

export const LEAD_STATUS_BADGE: Record<LeadStatus, string> = {
  NEW: "badge badge-open",
  CONTACTED: "badge badge-medium",
  QUALIFIED: "badge badge-gold",
  PROPOSAL_SENT: "badge badge-progress",
  NEGOTIATION: "badge badge-high",
  WON: "badge badge-resolved",
  LOST: "badge badge-closed",
};
