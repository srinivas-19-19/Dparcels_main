import { Request, Response } from 'express';
import { SupportService } from './support.service';
import { sendSuccess, sendError } from '../../utils/response';

export const createTicketController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');
    
    const { subject, message } = req.body;
    const ticket = await SupportService.createTicket(userId, subject, message);
    return sendSuccess(res, 201, ticket, 'Ticket created successfully');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to create ticket');
  }
};

export const getTicketsController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role as string;
    if (!userId) return sendError(res, 401, 'Unauthorized');
    
    const tickets = await SupportService.getTickets(userId, role);
    return sendSuccess(res, 200, tickets);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Failed to fetch tickets');
  }
};

export const getTicketByIdController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role as string;
    const ticketId = req.params.id as string;
    if (!userId) return sendError(res, 401, 'Unauthorized');
    
    const ticket = await SupportService.getTicketById(userId, role, ticketId);
    return sendSuccess(res, 200, ticket);
  } catch (error: any) {
    return sendError(res, 404, error.message || 'Ticket not found');
  }
};

export const addMessageController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role as string;
    const ticketId = req.params.id as string;
    const { message } = req.body;
    
    if (!userId) return sendError(res, 401, 'Unauthorized');
    
    const newMessage = await SupportService.addMessage(userId, role, ticketId, message);
    return sendSuccess(res, 201, newMessage, 'Message added successfully');
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Failed to add message');
  }
};
