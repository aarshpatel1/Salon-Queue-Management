import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";
import apiRequest from "../api/apiClient";
import { useSocket } from "../context/SocketContext";
import CustomerProfileModal from "../components/CustomerProfileModal";
import RealTimeTimeline from "../components/RealTimeTimeline";
import Avatar from "../components/Avatar";
import HomeLoader from "../components/HomeLoader";

export default function Home() {
	const { lastSyncTime } = useSocket();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedToken, setSelectedToken] = useState(null);

	const fetchSummary = async () => {
		try {
			const res = await apiRequest("/api/queue/summary");
			if (res.success) {
				setData(res);
			}
		} catch (err) {
			console.error("Failed to load queue summary:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSummary();
	}, [lastSyncTime]);

	const config = data?.salonConfig;
	const waitStats = data?.waitStats;
	const barbers = data?.barbers || [];
	const isOnlineOpen = data?.isOnlineJoiningAllowed;
	const waitingTokens = data?.waitingTokens || data?.upNext || [];

	if (loading && !data) {
		return <HomeLoader />;
	}

	return (
		<div className="space-y-6 max-w-7xl mx-auto select-none py-1">
			{/* Top Floating Island Header Pill */}
			<div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFFFF] p-5 md:p-6 rounded-[32px] border border-[#E4DBD0] shadow-xs animate-fade-in-scale stagger-1">
				<div className="flex items-center gap-3.5">
					<div className="w-12 h-12 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shadow-md">
						<Icon
							icon="solar:scissors-bold"
							className="w-6 h-6 -rotate-45 text-[#C2B4A3]"
						/>
					</div>
					<div>
						<h1 className="text-xl md:text-2xl font-black text-[#1C1A18] tracking-tight">
							{config?.salonName || "Élan Atelier"}
						</h1>
						<p className="text-xs text-[#4A4540] font-medium">
							Minimalist Luxury Grooming • Real-Time Salon Queue
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2.5">
					<div
						className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs border ${
							isOnlineOpen
								? "bg-[#F7F3EE] text-[#1C1A18] border-[#E4DBD0]"
								: "bg-[#1C1A18] text-[#F7F3EE] border-[#4A4540]"
						}`}
					>
						<span
							className={`w-2 h-2 rounded-full ${
								isOnlineOpen ? "bg-[#22c55e] animate-pulse" : "bg-[#ef4444]"
							}`}
						></span>
						<span>
							{isOnlineOpen ? "Open • Closes 9:00 PM" : "Queue Closed"}
						</span>
					</div>

					<NavLink
						to="/join"
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs bg-[#1C1A18] text-[#F7F3EE] hover:bg-[#4A4540] transition-all shadow-xs"
					>
						<Icon
							icon="solar:user-plus-bold"
							className="w-4 h-4 text-[#C2B4A3]"
						/>
						<span>Join Queue</span>
					</NavLink>
				</div>
			</div>

			{/* Main Grid: Hero Island & KPI Floating Capsules */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
				{/* Left Hero Dynamic Island Card */}
				<div className="lg:col-span-7 rounded-[36px] bg-[#1C1A18] text-[#F7F3EE] p-6 md:p-8 border border-[#4A4540] shadow-xl flex flex-col justify-between space-y-6 animate-fade-in-up stagger-2">
					<div className="grid md:grid-cols-2 gap-6 items-center">
						{/* Salon Interior Preview Image in Rounded Capsule */}
						<div className="relative rounded-[28px] overflow-hidden aspect-video md:aspect-4/3 border border-[#4A4540] shadow-md">
							<img
								src={
									config?.bannerImage ||
									"https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80"
								}
								alt="Élan Atelier Interior"
								className="w-full h-full object-cover"
							/>
							<div className="absolute bottom-3 left-3">
								<span className="text-[10px] uppercase font-black tracking-widest bg-[#1C1A18] text-[#F7F3EE] px-3 py-1 rounded-full border border-[#4A4540]">
									Private Lounge
								</span>
							</div>
						</div>

						{/* Hero Copy */}
						<div className="space-y-3.5">
							<span className="text-[10px] uppercase tracking-widest text-[#C2B4A3] font-black">
								Live Queue Experience
							</span>
							<h2 className="text-xl md:text-2xl font-black leading-tight text-[#F7F3EE]">
								Your styling session, <br />
								on your schedule.
							</h2>
							<p className="text-xs text-[#E4DBD0] leading-relaxed">
								Join our live queue, receive real-time updates directly on your
								device, and arrive exactly when your chair opens.
							</p>

							<div className="pt-2">
								<NavLink
									to="/join"
									className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs bg-[#F7F3EE] text-[#1C1A18] hover:bg-[#E4DBD0] transition-all shadow-md transform hover:-translate-y-0.5"
								>
									<Icon
										icon="solar:user-plus-bold"
										className="w-4 h-4 text-[#1C1A18]"
									/>
									<span>Get Live Queue Spot</span>
									<Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
								</NavLink>
							</div>
						</div>
					</div>
				</div>

				{/* Right: 4 KPI Dynamic Island Capsules */}
				<div className="lg:col-span-5 grid grid-cols-2 gap-4">
					{/* Card 1: Live Waiting */}
					<div className="bg-[#FFFFFF] p-5 rounded-[28px] border border-[#E4DBD0] shadow-xs flex flex-col justify-between animate-fade-in-up stagger-3">
						<div className="flex items-center justify-between">
							<span className="w-10 h-10 rounded-full bg-[#F7F3EE] text-[#1C1A18] flex items-center justify-center border border-[#E4DBD0]">
								<Icon
									icon="solar:users-group-rounded-bold"
									className="w-5 h-5"
								/>
							</span>
							<span className="text-[10px] font-black text-[#1C1A18] bg-[#E4DBD0] px-3 py-1 rounded-full border border-[#C2B4A3]">
								Live
							</span>
						</div>
						<div className="mt-4">
							<h3 className="text-3xl font-black text-[#1C1A18]">
								{waitStats?.waitingCount ?? waitingTokens.length}
							</h3>
							<p className="text-xs text-[#4A4540] font-semibold">
								Clients Waiting
							</p>
							<div className="mt-1 text-[11px] text-[#1C1A18] font-bold">
								{waitStats?.isPaused
									? "Stylists On Break"
									: `~${waitStats?.waitMinutes ?? 0}m est. wait`}
							</div>
						</div>
					</div>

					{/* Card 2: Est. Wait Duration */}
					<div className="bg-[#FFFFFF] p-5 rounded-[28px] border border-[#E4DBD0] shadow-xs flex flex-col justify-between animate-fade-in-up stagger-3">
						<div className="flex items-center justify-between">
							<span className="w-10 h-10 rounded-full bg-[#F7F3EE] text-[#1C1A18] flex items-center justify-center border border-[#E4DBD0]">
								<Icon icon="solar:clock-circle-bold" className="w-5 h-5" />
							</span>
							<span className="text-[10px] font-black text-[#4A4540] bg-[#F7F3EE] px-3 py-1 rounded-full border border-[#E4DBD0]">
								FCFS
							</span>
						</div>
						<div className="mt-4">
							<h3 className="text-3xl font-black text-[#1C1A18]">
								{waitStats?.waitMinutes ?? 0}m
							</h3>
							<p className="text-xs text-[#4A4540] font-semibold">
								Average Wait Ahead
							</p>
							<div className="mt-1 text-[10px] text-[#4A4540]">
								{waitStats?.activeBarbersCount ?? 0} active stylists on duty
							</div>
						</div>
					</div>

					{/* Card 3: Active Stylists */}
					<div className="bg-[#FFFFFF] p-5 rounded-[28px] border border-[#E4DBD0] shadow-xs flex flex-col justify-between animate-fade-in-up stagger-4">
						<div className="flex items-center justify-between">
							<span className="w-10 h-10 rounded-full bg-[#F7F3EE] text-[#1C1A18] flex items-center justify-center border border-[#E4DBD0]">
								<Icon
									icon="solar:scissors-bold"
									className="w-5 h-5 -rotate-45"
								/>
							</span>
							<span className="text-[10px] font-black text-[#1C1A18] bg-[#E4DBD0] px-3 py-1 rounded-full border border-[#C2B4A3]">
								Chairs
							</span>
						</div>
						<div className="mt-4">
							<h3 className="text-3xl font-black text-[#1C1A18]">
								{barbers.filter((b) => b.isOnDuty).length}
							</h3>
							<p className="text-xs text-[#4A4540] font-semibold">
								Active Stylists
							</p>
							<div className="mt-1 text-[10px] text-[#1C1A18] font-bold">
								{barbers.filter((b) => b.status === "Available").length} Chairs
								Available
							</div>
						</div>
					</div>

					{/* Card 4: Services Pricing */}
					<div className="bg-[#FFFFFF] p-5 rounded-[28px] border border-[#E4DBD0] shadow-xs flex flex-col justify-between animate-fade-in-up stagger-4">
						<div className="flex items-center justify-between">
							<span className="w-10 h-10 rounded-full bg-[#F7F3EE] text-[#1C1A18] flex items-center justify-center border border-[#E4DBD0]">
								<Icon icon="solar:tag-price-bold" className="w-5 h-5" />
							</span>
							<span className="text-[10px] font-black text-[#1C1A18] bg-[#F7F3EE] px-3 py-1 rounded-full border border-[#E4DBD0]">
								INR
							</span>
						</div>
						<div className="mt-4">
							<h3 className="text-3xl font-black text-[#1C1A18]">₹100+</h3>
							<p className="text-xs text-[#4A4540] font-semibold">
								Signature Grooming
							</p>
							<div className="mt-1 text-[10px] text-[#4A4540]">
								Haircuts, Shave & Spa
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Stylist Stations in Floating Pill Cards */}
			<div className="bg-[#FFFFFF] p-6 md:p-8 rounded-[36px] border border-[#E4DBD0] shadow-xs space-y-4 animate-fade-in-up stagger-5">
				<div className="flex flex-wrap items-center justify-between gap-3 pb-2 mb-1">
					<div>
						<h2 className="text-base font-black text-[#1C1A18] flex items-center gap-2">
							<Icon
								icon="solar:scissors-bold"
								className="w-5 h-5 text-[#4A4540]"
							/>
							<span>Stylist Stations & Active Chair Sessions</span>
						</h2>
						<p className="text-xs text-[#4A4540]">
							Real-time chair tracking with second-by-second live timelines
						</p>
					</div>
					<span className="text-[10px] font-black text-[#1C1A18] bg-[#E4DBD0] px-3 py-1 rounded-full border border-[#C2B4A3]">
						Real-Time Engine
					</span>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-1">
					{barbers.map((barber) => {
						const currentCust = barber.currentCustomer;
						const hasCustomer = currentCust && currentCust.tokenId;
						const isServing = barber.status === "Busy" && hasCustomer;

						return (
							<div
								key={barber._id}
								className={`p-4 rounded-[28px] border flex flex-col justify-between transition-all ${
									isServing
										? "border-[#1C1A18] bg-[#FFFFFF] shadow-sm"
										: barber.status === "On break"
											? "border-[#E4DBD0] bg-[#F7F3EE]/60"
											: "border-[#E4DBD0] bg-[#FFFFFF]"
								}`}
							>
								<div>
									<div className="flex items-center gap-3 mb-3">
										<Avatar
											src={barber.avatar}
											name={barber.name}
											size="w-10 h-10 text-xs"
											className="border border-[#C2B4A3] shrink-0"
										/>
										<div className="min-w-0 flex-1">
											<p className="font-black text-xs text-[#1C1A18] truncate">
												{barber.name}
											</p>
											<span
												className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full border ${
													barber.status === "Available"
														? "bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]"
														: barber.status === "Busy"
															? "bg-[#E4DBD0] text-[#1C1A18] border-[#C2B4A3]"
															: "bg-[#F7F3EE] text-[#4A4540] border-[#E4DBD0]"
												}`}
											>
												{barber.status}
											</span>
										</div>
									</div>

									{/* Real-time Timeline for Seated Guest */}
									{isServing && (
										<div className="mt-2 pt-2 border-t border-[#E4DBD0]">
											<div className="flex items-center justify-between text-[11px] font-bold text-[#1C1A18] mb-1.5 px-1">
												<span>{currentCust.tokenNumber}</span>
												<span className="truncate max-w-[80px] text-[#4A4540]">
													{currentCust.customerName}
												</span>
											</div>
											<RealTimeTimeline
												startedAt={currentCust.startedAt || new Date()}
												estimatedDuration={currentCust.estimatedDuration || 30}
												status="In chair"
												compact={true}
											/>
										</div>
									)}

									{!hasCustomer && (
										<p className="text-[10px] text-[#4A4540] italic pt-1 pl-1">
											{barber.status === "On break"
												? "Taking rest"
												: "Chair ready for call"}
										</p>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Live Waiting Queue in Floating Pill Capsules */}
			<div className="bg-[#FFFFFF] p-6 md:p-8 rounded-[36px] border border-[#E4DBD0] shadow-xs space-y-4 animate-fade-in-up stagger-6">
				<div className="flex flex-wrap items-center justify-between gap-3 pb-2 mb-1">
					<div>
						<h2 className="text-base font-black text-[#1C1A18] flex items-center gap-2">
							<Icon
								icon="solar:users-group-rounded-bold"
								className="w-5 h-5 text-[#1C1A18]"
							/>
							<span>Live Waiting Queue ({waitingTokens.length})</span>
						</h2>
						<p className="text-xs text-[#4A4540]">
							Click on your profile pill to inspect queue status (Self-removal
							disabled)
						</p>
					</div>

					<div className="flex items-center gap-2">
						<span className="text-[10px] font-black text-[#1C1A18] bg-[#E4DBD0] px-3.5 py-1 rounded-full border border-[#C2B4A3]">
							Click pill to view
						</span>
						<NavLink
							to="/join"
							className="text-xs font-bold text-[#F7F3EE] bg-[#1C1A18] px-4 py-2 rounded-full hover:bg-[#4A4540] transition-colors"
						>
							+ Join Queue
						</NavLink>
					</div>
				</div>

				{waitingTokens.length === 0 ? (
					<div className="py-12 text-center text-[#4A4540]">
						<Icon
							icon="solar:check-circle-bold"
							className="w-10 h-10 text-[#1C1A18] mx-auto mb-2"
						/>
						<p className="text-xs font-bold">
							Queue is clear! No clients waiting.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{waitingTokens.map((token, index) => {
							const waitMins = token.joinedAt
								? Math.max(
										0,
										Math.floor(
											(Date.now() - new Date(token.joinedAt).getTime()) / 60000,
										),
									)
								: 0;

							return (
								<div
									key={token._id}
									onClick={() => setSelectedToken(token)}
									className="p-4 rounded-full border border-[#E4DBD0] bg-[#F7F3EE] hover:bg-[#FFFFFF] hover:border-[#1C1A18] transition-all cursor-pointer flex items-center justify-between shadow-xs px-5"
								>
									<div className="flex items-center gap-3 min-w-0">
										<span className="text-xs font-black text-[#F7F3EE] bg-[#1C1A18] px-3 py-1 rounded-full shrink-0">
											{token.tokenNumber}
										</span>
										<Avatar
											src={token.avatar}
											name={token.customerName}
											size="w-8 h-8 text-[11px]"
											className="border border-[#C2B4A3] shrink-0"
										/>
										<div className="min-w-0">
											<p className="text-xs font-black text-[#1C1A18] truncate">
												{token.customerName}
											</p>
											<p className="text-[10px] text-[#4A4540] truncate">
												Pref: {token.preferredBarberName || "Any"}
											</p>
										</div>
									</div>

									<div className="text-right shrink-0 ml-2">
										<span className="text-[10px] font-bold bg-[#E4DBD0] text-[#1C1A18] px-2.5 py-0.5 rounded-full border border-[#C2B4A3]">
											#{index + 1} • {waitMins}m
										</span>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Screen Directory in Pill Island */}
			<div className="bg-[#1C1A18] rounded-[36px] p-6 md:p-8 text-[#F7F3EE] border border-[#4A4540] shadow-xl animate-fade-in-up stagger-7">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-1">
					<div>
						<h3 className="text-base font-black">Studio Screen Directory</h3>
						<p className="text-xs text-[#C2B4A3]">
							Direct access for staff consoles, client status checks, and
							settings
						</p>
					</div>
					<span className="text-[10px] bg-[#4A4540] text-[#F7F3EE] px-4 py-1.5 rounded-full font-mono border border-[#4A4540] self-start md:self-auto font-bold">
						Staff PIN: 1234
					</span>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
					<NavLink
						to="/join"
						className="p-4 rounded-[28px] bg-[#4A4540]/30 hover:bg-[#4A4540]/50 transition-colors border border-[#4A4540] flex flex-col justify-between"
					>
						<Icon
							icon="solar:user-plus-bold"
							className="w-5 h-5 text-[#F7F3EE] mb-2"
						/>
						<div>
							<p className="font-bold text-xs text-[#F7F3EE]">1. Join Queue</p>
							<p className="text-[10px] text-[#C2B4A3]">Guest Self Check-in</p>
						</div>
					</NavLink>

					<NavLink
						to="/reception"
						className="p-4 rounded-[28px] bg-[#4A4540]/30 hover:bg-[#4A4540]/50 transition-colors border border-[#4A4540] flex flex-col justify-between"
					>
						<Icon
							icon="solar:calendar-bold"
							className="w-5 h-5 text-[#F7F3EE] mb-2"
						/>
						<div>
							<p className="font-bold text-xs text-[#F7F3EE]">
								2. Reception Console
							</p>
							<p className="text-[10px] text-[#C2B4A3]">Tablet Mode (PIN)</p>
						</div>
					</NavLink>

					<NavLink
						to="/barber/Aarav%20Patel"
						className="p-4 rounded-[28px] bg-[#4A4540]/30 hover:bg-[#4A4540]/50 transition-colors border border-[#4A4540] flex flex-col justify-between"
					>
						<Icon
							icon="solar:scissors-bold"
							className="w-5 h-5 text-[#F7F3EE] mb-2"
						/>
						<div>
							<p className="font-bold text-xs text-[#F7F3EE]">
								3. Stylist Station
							</p>
							<p className="text-[10px] text-[#C2B4A3]">Chair View (PIN)</p>
						</div>
					</NavLink>

					{/* TV Screen: explicitly hidden on mobile devices! */}
					<NavLink
						to="/display"
						className="hidden md:flex p-4 rounded-[28px] bg-[#4A4540]/30 hover:bg-[#4A4540]/50 transition-colors border border-[#4A4540] flex-col justify-between"
					>
						<Icon
							icon="solar:tv-bold"
							className="w-5 h-5 text-[#F7F3EE] mb-2"
						/>
						<div>
							<p className="font-bold text-xs text-[#F7F3EE]">
								4. Lounge TV Display
							</p>
							<p className="text-[10px] text-[#C2B4A3]">Widescreen Mode</p>
						</div>
					</NavLink>

					<NavLink
						to="/admin"
						className="p-4 rounded-[28px] bg-[#4A4540]/30 hover:bg-[#4A4540]/50 transition-colors border border-[#4A4540] flex flex-col justify-between"
					>
						<Icon
							icon="solar:settings-bold"
							className="w-5 h-5 text-[#F7F3EE] mb-2"
						/>
						<div>
							<p className="font-bold text-xs text-[#F7F3EE]">
								5. Owner Settings
							</p>
							<p className="text-[10px] text-[#C2B4A3]">Studio Config (PIN)</p>
						</div>
					</NavLink>
				</div>
			</div>

			{/* Customer Profile Modal (Customer profile inspection - no self removal) */}
			<CustomerProfileModal
				token={selectedToken}
				isOpen={!!selectedToken}
				onClose={() => setSelectedToken(null)}
				isStaffView={false}
			/>
		</div>
	);
}
