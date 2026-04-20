import { z } from "zod";

// ─────────────────────────────────────────────
//  ENUMS
// ─────────────────────────────────────────────

export const UserRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "AGENT",
]);

export const TicketStatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "PENDING_CLIENT",
  "RESOLVED",
  "CLOSED",
]);

export const TicketPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const TicketCategorySchema = z.enum([
  "MAINTENANCE",
  "COMPLAINT",
  "INQUIRY",
  "PAYMENT",
  "LEASE",
  "HANDOVER",
  "OTHER",
]);

export const LeadStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

export const PropertyTypeSchema = z.enum([
  "APARTMENT",
  "VILLA",
  "TOWNHOUSE",
  "PENTHOUSE",
  "STUDIO",
  "DUPLEX",
  "COMMERCIAL",
]);

export const PropertyStatusSchema = z.enum([
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "RENTED",
  "UNDER_MAINTENANCE",
]);

export const InteractionTypeSchema = z.enum([
  "CALL",
  "EMAIL",
  "WHATSAPP",
  "MEETING",
  "SITE_VISIT",
  "NOTE",
]);

// ─────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: UserRoleSchema.default("AGENT"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

// ─────────────────────────────────────────────
//  CLIENT
// ─────────────────────────────────────────────

export const CreateClientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(7, "Phone is required"),
  whatsapp: z.string().optional(),
  nationality: z.string().optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const UpdateClientSchema = CreateClientSchema.partial();

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

// ─────────────────────────────────────────────
//  TICKET
// ─────────────────────────────────────────────

export const CreateTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description is required"),
  status: TicketStatusSchema.default("OPEN"),
  priority: TicketPrioritySchema.default("MEDIUM"),
  category: TicketCategorySchema.default("OTHER"),
  clientId: z.string().optional(),
  propertyId: z.string().optional(),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const UpdateTicketSchema = CreateTicketSchema.partial();

export const TicketCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  isInternal: z.boolean().default(false),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;
export type TicketCommentInput = z.infer<typeof TicketCommentSchema>;

// ─────────────────────────────────────────────
//  LEAD
// ─────────────────────────────────────────────

export const CreateLeadSchema = z.object({
  title: z.string().optional(),
  status: LeadStatusSchema.default("NEW"),
  source: z.string().optional(),
  budget: z.number().positive().optional(),
  clientId: z.string().optional(),
  propertyId: z.string().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  followUpDate: z.string().optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial();

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

// ─────────────────────────────────────────────
//  PROPERTY
// ─────────────────────────────────────────────

export const CreatePropertySchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required"),
  type: PropertyTypeSchema,
  status: PropertyStatusSchema.default("AVAILABLE"),
  project: z.string().optional(),
  building: z.string().optional(),
  floor: z.number().int().optional(),
  unit: z.string().optional(),
  area: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  price: z.number().positive().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
});

export const UpdatePropertySchema = CreatePropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;

// ─────────────────────────────────────────────
//  INTERACTION
// ─────────────────────────────────────────────

export const CreateInteractionSchema = z.object({
  type: InteractionTypeSchema,
  summary: z.string().min(3, "Summary is required"),
  details: z.string().optional(),
  duration: z.number().int().positive().optional(),
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export type CreateInteractionInput = z.infer<typeof CreateInteractionSchema>;

// ─────────────────────────────────────────────
//  PAGINATION & FILTERS
// ─────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const TicketFilterSchema = PaginationSchema.extend({
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  category: TicketCategorySchema.optional(),
  assignedToId: z.string().optional(),
  clientId: z.string().optional(),
});

export const LeadFilterSchema = PaginationSchema.extend({
  status: LeadStatusSchema.optional(),
  assignedToId: z.string().optional(),
  clientId: z.string().optional(),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
export type TicketFilterInput = z.infer<typeof TicketFilterSchema>;
export type LeadFilterInput = z.infer<typeof LeadFilterSchema>;
