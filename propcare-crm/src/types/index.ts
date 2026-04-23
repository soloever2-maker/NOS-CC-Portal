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

export type ContactStatus =
  | "NOT_CONTACTED"
  | "NO_ANSWER"
  | "NOT_REACHABLE"
  | "REACHED"
  | "CALLBACK_REQUESTED";

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
  tickets?: Ticket[];
  properties?: ClientProperty[];
  _count?: { tickets: number };
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
  tickets?: Ticket[];
  clients?: ClientProperty[];
}

export interface ClientProperty {
  id: string;
  clientId: string;
  unitId: string;
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
  contactStatus?: ContactStatus | null;
  project?: string | null;
  source?: string | null;
  slaHours?: number | null;
  clientId?: string | null;
  unitId?: string | null;
  assignedToId?: string | null;
  createdById: string;
  dueDate?: Date | null;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
  attachments: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
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

export interface Interaction {
  id: string;
  type: InteractionType;
  summary: string;
  details?: string | null;
  duration?: number | null;
  clientId?: string | null;
  userId: string;
  scheduledAt?: Date | null;
  createdAt: Date;
  client?: Client | null;
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
  ticketsByStatus: Record<TicketStatus, number>;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByCategory: Record<TicketCategory, number>;
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

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  NOT_CONTACTED: "Not Contacted",
  NO_ANSWER:     "No Answer",
  NOT_REACHABLE: "Not Reachable",
  REACHED:       "Reached",
  CALLBACK_REQUESTED: "Callback Requested",
};

export const CONTACT_STATUS_COLORS: Record<ContactStatus, { bg: string; color: string }> = {
  NOT_CONTACTED:      { bg: "rgba(100,100,100,0.1)",  color: "#888" },
  NO_ANSWER:          { bg: "rgba(245,158,11,0.1)",   color: "#f59e0b" },
  NOT_REACHABLE:      { bg: "rgba(239,68,68,0.1)",    color: "#ef4444" },
  REACHED:            { bg: "rgba(34,197,94,0.1)",    color: "#22c55e" },
  CALLBACK_REQUESTED: { bg: "rgba(59,130,246,0.1)",   color: "#3b82f6" },
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
