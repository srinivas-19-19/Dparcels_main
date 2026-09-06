import prisma from '../../utils/prisma';

export const SupportService = {
  async createTicket(userId: string, subject: string, initialMessage?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true }
    });
    
    if (!user?.customerProfile) {
      throw new Error('Only customers can create support tickets right now.');
    }

    return prisma.$transaction(async (tx: any) => {
      const ticket = await tx.supportTicket.create({
        data: {
          customerProfileId: user.customerProfile!.id,
          subject,
          status: 'OPEN',
        }
      });

      if (initialMessage) {
        await tx.supportMessage.create({
          data: {
            supportTicketId: ticket.id,
            senderId: userId,
            senderRole: user.role,
            message: initialMessage
          }
        });
      }

      return ticket;
    });
  },

  async getTickets(userId: string, role: string) {
    if (role === 'ADMIN') {
      // Admin sees all open and in-progress tickets
      return prisma.supportTicket.findMany({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: { updatedAt: 'desc' },
        include: { customer: { include: { user: { select: { email: true } } } } }
      });
    }

    // Customer sees their own
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true }
    });
    
    if (!user?.customerProfile) return [];

    return prisma.supportTicket.findMany({
      where: { customerProfileId: user.customerProfile.id },
      orderBy: { updatedAt: 'desc' }
    });
  },

  async getTicketById(userId: string, role: string, ticketId: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!ticket) throw new Error('Ticket not found');

    if (role !== 'ADMIN') {
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { customerProfile: true } });
      if (ticket.customerProfileId !== user?.customerProfile?.id) {
        throw new Error('Unauthorized access to ticket');
      }
    }

    return ticket;
  },

  async addMessage(userId: string, role: string, ticketId: string, message: string) {
    const ticket = await this.getTicketById(userId, role, ticketId); // Reuses auth check
    
    return prisma.$transaction(async (tx: any) => {
      const newMessage = await tx.supportMessage.create({
        data: {
          supportTicketId: ticket.id,
          senderId: userId,
          senderRole: role,
          message
        }
      });

      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: {
          status: role === 'ADMIN' ? 'IN_PROGRESS' : 'OPEN', // Simple status progression logic
          updatedAt: new Date()
        }
      });

      return newMessage;
    });
  }
};
