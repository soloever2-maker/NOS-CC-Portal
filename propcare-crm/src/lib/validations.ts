import { z } from "zod";

export const TicketStatusSchema = z.enum(["OPEN","IN_PROGRESS","PENDING_CLIENT","RESOLVED","CLOSED"]);
export const TicketPrioritySchema = z.enum(["LOW","MEDIUM","HIGH","URGENT"]);
export const TicketCategorySchema = z.enum(["MAINTENANCE","COMPLAINT","INQUIRY","PAYMENT","LEASE","HANDOVER","OTHER"]);
export const ContactStatusSchema = z.enum(["NOT_CONTACTED","NO_ANSWER","NOT_REACHABLE","REACHED","CALLBACK_REQUESTED"]);
export const PropertyTypeSchema = z.enum(["APARTMENT","VILLA","TOWNHOUSE","PENTHOUSE","STUDIO","DUPLEX","COMMERCIAL"]);
export const PropertyStatusSchema = z.enum(["AVAILABLE","RESERVED","SOLD","RENTED","UNDER_MAINTENANCE"]);
export const InteractionTypeSchema = z.enum(["CALL","EMAIL","WHATSAPP","MEETING","SITE_VISIT","NOTE"]);

export const CreateTicketSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  status: TicketStatusSchema.default("OPEN"),
  priority: TicketPrioritySchema.default("MEDIUM"),
  category: TicketCategorySchema.default("OTHER"),
  contactStatus: ContactStatusSchema.default("NOT_CONTACTED").optional(),
  project: z.string().optional(),
  source: z.string().optional(),
  clientId: z.string().optional(),
  unitId: z.string().optional(),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
  slaHours: z.number().optional(),
});
export const UpdateTicketSchema = CreateTicketSchema.partial();
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;

export const CreateClientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(8).max(20),
  phone2: z.string().optional(),
  whatsapp: z.string().optional(),
  referralNumber: z.string().optional(),
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

export const CreatePropertySchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(2).max(200),
  type: PropertyTypeSchema,
  status: PropertyStatusSchema.default("AVAILABLE"),
  project: z.string().optional(),
  building: z.string().optional(),
  floor: z.number().optional(),
  unit: z.string().optional(),
  area: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  price: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
});
export const UpdatePropertySchema = CreatePropertySchema.partial();
export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;

export const CreateInteractionSchema = z.object({
  type: InteractionTypeSchema,
  summary: z.string().min(3).max(500),
  details: z.string().optional(),
  duration: z.number().optional(),
  clientId: z.string().optional(),
});
export type CreateInteractionInput = z.infer<typeof CreateInteractionSchema>;

export const PaginationSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc","desc"]).default("desc"),
});

export const TicketFilterSchema = PaginationSchema.extend({
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  category: TicketCategorySchema.optional(),
  contactStatus: ContactStatusSchema.optional(),
  search: z.string().optional(),
  project: z.string().optional(),
  assignedToId: z.string().optional(),
});
export type TicketFilterInput = z.infer<typeof TicketFilterSchema>;
