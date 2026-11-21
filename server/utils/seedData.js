import SalonConfig from '../models/SalonConfig.js';
import Service from '../models/Service.js';
import Barber from '../models/Barber.js';
import QueueToken from '../models/QueueToken.js';

export const seedDatabase = async () => {
  try {
    // 1. Seed Salon Config if not exists
    const existingConfig = await SalonConfig.findOne();
    if (!existingConfig) {
      await SalonConfig.create({
        salonName: 'Branja Barber Studio',
        tagline: 'Your style, effortlessly. Find your barber. Book your next fresh look.',
        openingTime: '09:00',
        closingTime: '21:00',
        onlineJoiningCutoffMinutes: 30,
        isMasterQueueOpen: true,
        staffPin: '1234',
        bannerImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80'
      });
      console.log('[Seed] SalonConfig initialized');
    }

    // 2. Seed Services if not exists
    const servicesCount = await Service.countDocuments();
    if (servicesCount === 0) {
      const defaultServices = [
        {
          name: 'Haircut',
          duration: 30,
          price: 150,
          isActive: true,
          category: 'Hair',
          icon: 'scissors'
        },
        {
          name: 'Beard trim',
          duration: 15,
          price: 80,
          isActive: true,
          category: 'Beard',
          icon: 'beard'
        },
        {
          name: 'Hair spa',
          duration: 45,
          price: 400,
          isActive: true,
          category: 'Spa',
          icon: 'sparkles'
        }
      ];
      await Service.insertMany(defaultServices);
      console.log('[Seed] Default 3 services inserted');
    }

    // 3. Seed Barbers if not exists
    const barbersCount = await Barber.countDocuments();
    if (barbersCount === 0) {
      const defaultBarbers = [
        {
          name: 'Dudu Tassa',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
          specialty: 'Haircut + Beard Styling',
          isOnDuty: true,
          status: 'Available'
        },
        {
          name: 'Lior Cohen',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
          specialty: 'Trim + Facial Grooming',
          isOnDuty: true,
          status: 'Available'
        },
        {
          name: 'Liam Carter',
          avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
          specialty: 'Hair Trim & Facial Care',
          isOnDuty: true,
          status: 'Available'
        },
        {
          name: 'Noah Bennett',
          avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
          specialty: 'Beard Styling & Hair Refresh',
          isOnDuty: true,
          status: 'On break'
        },
        {
          name: 'Eyal Hossain',
          avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
          specialty: 'Male Hairstylist & Colorist',
          isOnDuty: true,
          status: 'Available'
        }
      ];
      await Barber.insertMany(defaultBarbers);
      console.log('[Seed] Default 5 barbers initialized');
    }

    // 4. Seed initial queue tokens if empty so dashboard is immediately rich and alive
    const tokensCount = await QueueToken.countDocuments();
    if (tokensCount === 0) {
      const dudu = await Barber.findOne({ name: 'Dudu Tassa' });
      const lior = await Barber.findOne({ name: 'Lior Cohen' });
      const haircut = await Service.findOne({ name: 'Haircut' });
      const beard = await Service.findOne({ name: 'Beard trim' });

      if (haircut && beard) {
        await QueueToken.create([
          {
            tokenNumber: 'S-1',
            tokenSequence: 1,
            customerName: 'Karan Mehta',
            phone: '9876543210',
            services: [
              { serviceId: haircut._id, name: haircut.name, duration: haircut.duration, price: haircut.price },
              { serviceId: beard._id, name: beard.name, duration: beard.duration, price: beard.price }
            ],
            totalDuration: 45,
            totalPrice: 230,
            preferredBarber: dudu ? dudu._id : null,
            preferredBarberName: dudu ? dudu.name : 'Any barber (fastest)',
            status: 'Waiting',
            joinedAt: new Date(Date.now() - 35 * 60000)
          },
          {
            tokenNumber: 'S-2',
            tokenSequence: 2,
            customerName: 'Jeet Patel',
            phone: '9876543211',
            services: [
              { serviceId: haircut._id, name: haircut.name, duration: haircut.duration, price: haircut.price }
            ],
            totalDuration: 30,
            totalPrice: 150,
            preferredBarber: null,
            preferredBarberName: 'Any barber (fastest)',
            status: 'Waiting',
            joinedAt: new Date(Date.now() - 20 * 60000)
          },
          {
            tokenNumber: 'S-3',
            tokenSequence: 3,
            customerName: 'Vraj Doshi',
            phone: '9876543212',
            services: [
              { serviceId: beard._id, name: beard.name, duration: beard.duration, price: beard.price }
            ],
            totalDuration: 15,
            totalPrice: 80,
            preferredBarber: lior ? lior._id : null,
            preferredBarberName: lior ? lior.name : 'Any barber (fastest)',
            status: 'Waiting',
            joinedAt: new Date(Date.now() - 5 * 60000)
          }
        ]);
        console.log('[Seed] Sample queue tokens added');
      }
    }
  } catch (error) {
    console.error('[Seed Error]:', error.message);
  }
};
