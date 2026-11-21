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
        salonName: 'Élan Atelier',
        tagline: 'Minimalist Luxury Grooming & Smart Lounge Queue',
        openingTime: '09:00',
        closingTime: '21:00',
        onlineJoiningCutoffMinutes: 30,
        isMasterQueueOpen: true,
        staffPin: '1234',
        bannerImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80'
      });
      console.log('[Seed] SalonConfig initialized');
    } else if (existingConfig.salonName === 'Branja Barber Studio') {
      existingConfig.salonName = 'Élan Atelier';
      existingConfig.tagline = 'Minimalist Luxury Grooming & Smart Lounge Queue';
      await existingConfig.save();
    }

    // 2. Seed Services if not exists
    const servicesCount = await Service.countDocuments();
    if (servicesCount === 0) {
      const defaultServices = [
        {
          name: 'Classic Signature Haircut',
          duration: 30,
          price: 180,
          isActive: true,
          category: 'Hair',
          icon: 'scissors'
        },
        {
          name: 'Precision Beard Sculpt & Lineup',
          duration: 20,
          price: 100,
          isActive: true,
          category: 'Beard',
          icon: 'beard'
        },
        {
          name: 'Botanical Hair Spa & Scalp Therapy',
          duration: 45,
          price: 450,
          isActive: true,
          category: 'Spa',
          icon: 'sparkles'
        },
        {
          name: 'Luxury Hot Towel Shave',
          duration: 25,
          price: 150,
          isActive: true,
          category: 'Beard',
          icon: 'beard'
        },
        {
          name: 'Charcoal Clay Detox Facial',
          duration: 35,
          price: 380,
          isActive: true,
          category: 'Spa',
          icon: 'sparkles'
        },
        {
          name: 'Natural Grey Blending & Tint',
          duration: 40,
          price: 500,
          isActive: true,
          category: 'Hair',
          icon: 'scissors'
        }
      ];
      await Service.insertMany(defaultServices);
      console.log('[Seed] Default grooming services inserted');
    }

    // 3. Seed Barbers if not exists or if still holding legacy names
    const barbersCount = await Barber.countDocuments();
    const hasLegacyBarber = await Barber.findOne({ name: { $in: ['Dudu Tassa', 'Alex Vance', 'Lior Cohen'] } });
    
    if (barbersCount === 0 || hasLegacyBarber) {
      if (hasLegacyBarber) {
        await Barber.deleteMany({});
      }
      const defaultBarbers = [
        {
          name: 'Aarav Patel',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
          specialty: 'Master Stylist & Signature Fade',
          isOnDuty: true,
          status: 'Available'
        },
        {
          name: 'Tirth Shah',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
          specialty: 'Beard Artisan & Royal Hot Towel Shave',
          isOnDuty: true,
          status: 'Available'
        },
        {
          name: 'Meet Prajapati',
          avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
          specialty: 'Senior Texture & Creative Hair Colorist',
          isOnDuty: true,
          status: 'Available'
        },
        {
          name: 'Devendra Solanki',
          avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
          specialty: 'Botanical Scalp & Beard Sculpting',
          isOnDuty: true,
          status: 'On break'
        },
        {
          name: 'Parth Joshi',
          avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
          specialty: 'Modern Haircut & Facial Grooming',
          isOnDuty: true,
          status: 'Available'
        }
      ];
      await Barber.insertMany(defaultBarbers);
      console.log('[Seed] Authentic Indian Gujarati barbers initialized');
    }

    // 4. Seed initial queue tokens if empty so dashboard is immediately rich and alive
    const tokensCount = await QueueToken.countDocuments();
    const hasLegacyCustomer = await QueueToken.findOne({ customerName: { $in: ['Alex Vance', 'Liam', 'Noah', 'John Doe'] } });

    if (tokensCount === 0 || hasLegacyCustomer) {
      if (hasLegacyCustomer) {
        await QueueToken.deleteMany({});
      }
      const aarav = await Barber.findOne({ name: 'Aarav Patel' });
      const tirth = await Barber.findOne({ name: 'Tirth Shah' });
      const meet = await Barber.findOne({ name: 'Meet Prajapati' });
      const parth = await Barber.findOne({ name: 'Parth Joshi' });

      const haircut = (await Service.findOne({ name: 'Classic Signature Haircut' })) || (await Service.findOne({ name: 'Haircut' }));
      const beard = (await Service.findOne({ name: 'Precision Beard Sculpt & Lineup' })) || (await Service.findOne({ name: 'Beard trim' }));
      const spa = (await Service.findOne({ name: 'Botanical Hair Spa & Scalp Therapy' })) || (await Service.findOne({ name: 'Hair spa' }));
      const shave = (await Service.findOne({ name: 'Luxury Hot Towel Shave' })) || beard;

      if (haircut && beard) {
        // Token 1 (In chair with Aarav Patel)
        const token1 = await QueueToken.create({
          tokenNumber: 'S-1',
          tokenSequence: 1,
          customerName: 'Karan Mehta',
          phone: '9879101234',
          services: [
            { serviceId: haircut._id, name: haircut.name, duration: haircut.duration, price: haircut.price },
            { serviceId: beard._id, name: beard.name, duration: beard.duration, price: beard.price }
          ],
          totalDuration: 50,
          totalPrice: 280,
          preferredBarber: aarav ? aarav._id : null,
          preferredBarberName: aarav ? aarav.name : 'Any barber (fastest)',
          assignedBarber: aarav ? aarav._id : null,
          assignedBarberName: aarav ? aarav.name : 'Aarav Patel',
          status: 'In chair',
          joinedAt: new Date(Date.now() - 30 * 60000),
          calledAt: new Date(Date.now() - 15 * 60000),
          startedAt: new Date(Date.now() - 12 * 60000)
        });

        // Set Aarav to busy serving Karan Mehta
        if (aarav) {
          aarav.status = 'Busy';
          aarav.currentCustomer = {
            tokenId: token1._id,
            tokenNumber: 'S-1',
            customerName: 'Karan Mehta',
            services: ['Classic Signature Haircut', 'Precision Beard Sculpt & Lineup'],
            startedAt: new Date(Date.now() - 12 * 60000),
            estimatedDuration: 50
          };
          await aarav.save();
        }

        // Live Queue: Indian Gujarati Customers
        await QueueToken.create([
          {
            tokenNumber: 'S-2',
            tokenSequence: 2,
            customerName: 'Jeet Patel',
            phone: '9825012345',
            services: [
              { serviceId: haircut._id, name: haircut.name, duration: haircut.duration, price: haircut.price }
            ],
            totalDuration: 30,
            totalPrice: 180,
            preferredBarber: null,
            preferredBarberName: 'Any barber (fastest)',
            status: 'Waiting',
            joinedAt: new Date(Date.now() - 25 * 60000)
          },
          {
            tokenNumber: 'S-3',
            tokenSequence: 3,
            customerName: 'Vraj Doshi',
            phone: '9724023456',
            services: [
              { serviceId: beard._id, name: beard.name, duration: beard.duration, price: beard.price }
            ],
            totalDuration: 20,
            totalPrice: 100,
            preferredBarber: tirth ? tirth._id : null,
            preferredBarberName: tirth ? tirth.name : 'Any barber (fastest)',
            status: 'Waiting',
            joinedAt: new Date(Date.now() - 20 * 60000)
          },
          {
            tokenNumber: 'S-4',
            tokenSequence: 4,
            customerName: 'Harshil Trivedi',
            phone: '9909034567',
            services: [
              { serviceId: spa ? spa._id : haircut._id, name: spa ? spa.name : haircut.name, duration: spa ? spa.duration : 45, price: spa ? spa.price : 450 }
            ],
            totalDuration: 45,
            totalPrice: 450,
            preferredBarber: null,
            preferredBarberName: 'Any barber (fastest)',
            status: 'Waiting',
            isWalkIn: true,
            joinedAt: new Date(Date.now() - 15 * 60000)
          },
          {
            tokenNumber: 'S-5',
            tokenSequence: 5,
            customerName: 'Chirag Shah',
            phone: '9898045678',
            services: [
              { serviceId: shave._id, name: shave.name, duration: shave.duration, price: shave.price }
            ],
            totalDuration: 25,
            totalPrice: 150,
            preferredBarber: parth ? parth._id : null,
            preferredBarberName: parth ? parth.name : 'Any barber (fastest)',
            status: 'Waiting',
            joinedAt: new Date(Date.now() - 10 * 60000)
          },
          {
            tokenNumber: 'S-6',
            tokenSequence: 6,
            customerName: 'Rohan Desai',
            phone: '9426056789',
            services: [
              { serviceId: haircut._id, name: haircut.name, duration: haircut.duration, price: haircut.price },
              { serviceId: beard._id, name: beard.name, duration: beard.duration, price: beard.price }
            ],
            totalDuration: 50,
            totalPrice: 280,
            preferredBarber: null,
            preferredBarberName: 'Any barber (fastest)',
            status: 'Waiting',
            joinedAt: new Date(Date.now() - 7 * 60000)
          },
          {
            tokenNumber: 'S-7',
            tokenSequence: 7,
            customerName: 'Bhavik Bhatt',
            phone: '9974067890',
            services: [
              { serviceId: haircut._id, name: haircut.name, duration: haircut.duration, price: haircut.price }
            ],
            totalDuration: 30,
            totalPrice: 180,
            preferredBarber: meet ? meet._id : null,
            preferredBarberName: meet ? meet.name : 'Any barber (fastest)',
            status: 'Waiting',
            joinedAt: new Date(Date.now() - 4 * 60000)
          },
          {
            tokenNumber: 'S-8',
            tokenSequence: 8,
            customerName: 'Dhyey Vora',
            phone: '9712089012',
            services: [
              { serviceId: beard._id, name: beard.name, duration: beard.duration, price: beard.price }
            ],
            totalDuration: 20,
            totalPrice: 100,
            preferredBarber: null,
            preferredBarberName: 'Any barber (fastest)',
            status: 'Waiting',
            isWalkIn: true,
            joinedAt: new Date(Date.now() - 2 * 60000)
          }
        ]);
        console.log('[Seed] Sample Indian Gujarati queue tokens initialized');
      }
    }
  } catch (error) {
    console.error('[Seed Error]:', error.message);
  }
};
