"use strict";

let networthInterval = false;

(async () => {
	const page = getPage();

	if (page !== "home") return;

	featureManager.registerFeature(
		"Live Networth",
		"home",
		() => settings.pages.home.networthDetails,
		null,
		showNetworth,
		() => removeContainer("Live Networth"),
		{
			storage: ["settings.pages.home.networthDetails", "settings.apiUsage.user.networth", "userdata.networth.date"],
		},
		() => hasAPIData() && settings.apiUsage.user.networth
	);

	async function showNetworth() {
		if (!userdata.networth || Date.now() - userdata.networth.date >= TO_MILLIS.MINUTES * 5) {
			chrome.runtime.sendMessage({ action: "updateData", type: "networth" });
			return;
		}

		await requireContent();

		const { content } = createContainer("Live Networth", {
			collapsible: false,
			showHeader: false,
			applyRounding: false,
			parentElement: document.find("h5=General Information").parentElement.nextElementSibling.find("ul.info-cont-wrap"),
		});
		let networthRow = newRow("(Live) Networth", `$${formatNumber(userdata.networth.total)}`);
		networthRow.style.backgroundColor = "#65c90069";

		// Networth last updated info icon
		let infoIcon = document.newElement({
			type: "i",
			class: "networth-info-icon",
			attributes: {
				seconds: (Date.now() - userdata.networth.date) / 1000,
				title: "Last updated " + formatTime({ milliseconds: userdata.networth.date }, { type: "ago" }),
				style: "margin-left: 9px;",
			},
		});
		networthRow.find(".desc").appendChild(infoIcon);
		content.appendChild(networthRow);

		// Update 'last updated'
		networthInterval = setInterval(() => {
			let seconds = parseInt(infoIcon.getAttribute("seconds")) + 1;

			infoIcon.setAttribute("title", `Last updated: ${formatTime({ milliseconds: Date.now() - seconds * 1000 }, { type: "ago" })}`);
			infoIcon.setAttribute("seconds", `${seconds}`);
		}, 1000);

		const table = document.newElement({
			type: "table",
			class: "tt-networth-comparison",
			children: [
				document.newElement({
					type: "tr",
					children: ["Type", "Value", "Change"].map((value) => document.newElement({ type: "th", text: value })),
				}),
			],
		});

		for (let type of getNetworthTypes()) {
			addToTable(type);
		}

		content.appendChild(
			document.newElement({
				type: "li",
				class: "comparison",
				children: [
					table,
					document.newElement({ type: "div", class: "tt-networth-footer", text: "Networth change compared to Torn's last known Networth" }),
				],
			})
		);

		function newRow(name, value) {
			return document.newElement({
				type: "li",
				children: [
					document.newElement({
						type: "div",
						class: "divider",
						children: [document.newElement({ type: "span", text: name, style: { backgroundColor: "transparent" } })],
					}),
					document.newElement({
						type: "div",
						class: "desc",
						children: [document.newElement({ type: "span", text: value, style: { paddingLeft: "3px" } })],
					}),
				],
			});
		}

		function getNetworthTypes() {
			return [
				"Cash (Wallet and Vault)",
				"Points",
				"Items",
				"Bazaar",
				"Display Case",
				"Bank",
				"Trade",
				"Piggy Bank",
				"Stock Market",
				"Company",
				"Bookie",
				"Auction House",
				"Cayman",
				"Total",
			];
		}

		function addToTable(type) {
			let current, previous;

			let name = type.toLowerCase().replaceAll(" ", "");
			if (type === "Trade") name = "pending";

			if (type.includes("Cash")) {
				current = userdata.networth.wallet + userdata.networth.vault;
				previous = userdata.personalstats.networthwallet + userdata.personalstats.networthvault;
			} else if (type === "Total") {
				current = userdata.networth.total;
				previous = userdata.personalstats.networth;
			} else {
				current = userdata.networth[name];
				previous = userdata.personalstats[`networth` + name];
			}
			if (current === previous) return;

			const isPositive = current > previous;

			table.appendChild(
				document.newElement({
					type: "tr",
					children: [
						document.newElement({ type: "td", text: type }),
						document.newElement({ type: "td", text: `$${formatNumber(current, { shorten: true })}` }),
						document.newElement({
							type: "td",
							text: `${isPositive ? "+" : "-"}$${formatNumber(Math.abs(current - previous), { shorten: true })}`,
							class: isPositive ? "positive" : "negative",
						}),
					],
				})
			);
		}
	}
})();