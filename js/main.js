// Prepare variables.
var cropList;

var svgWidth = 1080;
var svgMinWidth = 300;
var svgHeight = 480;

var width = svgWidth - 48;
var height = (svgHeight - 56) / 2;
var barPadding = 4;
var paddingLeft = 8;
var barWidth = width / seasons[options.season].crops.length - barPadding;
var miniBar = 8;
var barOffsetX = 29;
var barOffsetY = 40;
var graphDescription = "Profit";

// Prepare web elements.
var svg = d3.select("div.graph")
	.append("svg")
	.attr("width", svgWidth)
	.attr("height", svgHeight)
	.style("background-color", "#333333")
	.style("border-radius", "8px");

var tooltip = d3.select("body")
	.append("div")
	.style("position", "absolute")
	.style("z-index", 10)
	.style("visibility", "hidden")
	.style("background", "rgb(0, 0, 0)")
	.style("background", "rgba(0, 0, 0, 0.75)")
	.style("padding", "8px")
	.style("border-radius", "8px")
	.style("border", "2px solid black");

var gAxis = svg.append("g");
var gTitle = svg.append("g");
var gProfit = svg.append("g");
var gSeedLoss = svg.append("g");
var gFertLoss = svg.append("g");
var gIcons = svg.append("g");
var gTooltips = svg.append("g");

var axisY;
var barsProfit;
var barsSeed;
var barsFert;
var imgIcons;
var barsTooltips;
var options;
var MAX_INT = Number.MAX_SAFE_INTEGER || Number.MAX_VALUE;

/*
 * Formats a specified number, adding separators for thousands.
 * @param num The number to format.
 * @return Formatted string.
 */
function formatNumber(num) {
    num = num.toFixed(2) + '';
    x = num.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

/*
 * Calculates the maximum number of harvests for a crop, specified days, season, etc.
 * @param cropID The ID of the crop to calculate. This corresponds to the crop number of the selected season.
 * @return Number of harvests for the specified crop.
 */
function harvests(crop) {
	var fertilizer = fertilizers[options.fertilizer];
	// Tea blooms every day for the last 7 days of a season
	var isTea = crop.name == "Tea Leaves";
	var result = {}

	// if the crop is NOT cross season, remove 28 extra days for each extra season
	var remainingDays = options.days - 28;
	if (options.crossSeason && options.season != 4) {
        var i = options.season + 1;
        if (i >= 4)
            i = 0;
		for (var j = 0; j < seasons[i].crops.length; j++) {
			var seasonCrop = seasons[i].crops[j];
			if (crop.name == seasonCrop.name) {
				remainingDays += 28;
				break;
			}
		}
	}
    else {
        remainingDays = options.days;
    }
	/*
		initialPlanted 		= crop.planted;
		harvests			= logically calculated \\ incremented by one each time a harvest has matured. This also reflects 1 produce was received. This will tell us how many times the player had to harvest for produce
		extraProduce		= logically calculated \\ if a crop as extra produce, increment extra by # of extra. This is not extra predicted produce!
		replanted			= logically calculated * Initial Planted \\ Number of times crop was replanted to accommodate x Days. Incremented by one each time a harvest has matured for non-regrowing crops.
		seedsProduced		= if options.replant true then take away 1 produce and create 2 seeds
		seedsUsed			= counter
		produceConverted	= counter
	*/

	const initialPlanted = Number(crop.planted);
	let harvests = 0;
	let extraProduce = 0;
	let replanted = 0;
	let day = 1;
	let seedsProduced = 0;
	let seedsUsed = 0;
	let produceConverted = 0;
	let extraProduceByChance = 0;

	if (options.skills.agri)
		day += Math.floor(crop.growth.initial * (fertilizer.growth - 0.1));
	else
		day += Math.floor(crop.growth.initial * fertilizer.growth);

	//First harvest after maturity
	if (day <= remainingDays && (!isTea || ((day-1) % 28 + 1) > 21))
		harvests = harvests + initialPlanted;
		if(crop.produce.extra > 0){
			extraProduce = crop.produce.extra * initialPlanted;
		}
		//ADD PREDICTION OF EXTRAPERC HERE

	while (day <= remainingDays) {
		if (crop.growth.regrow > 0) {
			day += crop.growth.regrow;
		}
		else {
			if (options.skills.agri)
				day += Math.floor(crop.growth.initial * (fertilizer.growth - 0.1));
			else
				day += Math.floor(crop.growth.initial * fertilizer.growth);
		}

		//Next harvest, replanted for non regrowing crops
		if (day <= remainingDays && (!isTea || ((day-1) % 28 + 1) > 21))
			if (crop.growth.regrow > 0){
				harvests = harvests + initialPlanted;
				if(crop.produce.extra > 0){
					extraProduce = extraProduce + (crop.produce.extra * initialPlanted);
				}
				//ADD PREDICTION OF EXTRAPERC HERE
				for(i=initialPlanted;i>0;i--){
					if(crop.produce.extraPerc > 0){
						if(PredictExtraHarvest(crop)){
							extraProduceByChance++;
						}
					}
				}
			} else {
				harvests = harvests + initialPlanted;
				replanted = replanted + initialPlanted;
				if(crop.produce.extra > 0){
					extraProduce = extraProduce + (crop.produce.extra * initialPlanted);
				}

				//if we initially started with more than 1 planted seed then this needs to be modified so we don't have too many seeds remaining at the end of the cycle
				for(i=initialPlanted;i>0;i--){
					//ADD PREDICTION OF EXTRAPERC HERE
					if(crop.produce.extraPerc > 0){
						if(PredictExtraHarvest(crop)){
							extraProduceByChance++;
						}
					}
					if(options.replant){
						//I have seeds to use
						if(seedsProduced > 0){
							seedsUsed++;
							seedsProduced--;
						//I need to make seeds and use one
						} else {
							//Use 1 produce to make 2 seeds
							seedsProduced += 2;
							produceConverted++;

							//Plant one seed
							seedsUsed++;
							seedsProduced--;
						}
					}
				}
			}
	}

	/*
		initialPlanted 		= crop.planted;
		harvests			= logically calculated // incremented by one each time a harvest has matured. This also reflects 1 produce was received. This will tell us how many times the player had to harvest for produce
		extraProduce		= logically calculated // if a crop as extra produce, increment extra by # of extra. This is not extra predicted produce!
		replanted			= logically calculated // Number of times crop was replanted to accommodate x Days. Incremented by one each time a harvest has matured for non-regrowing crops.
		seedsProduced		= if options.replant true then take away 1 produce and create 2 seeds
		seedsUsed			= counter
		produceConverted	= counter

		result.replanted			= replanted * Initial Planted // Number of times crop was replanted times initial number planted
		result.totalPlanted			= initialPlanted + replanted // Total Number of times crop was planted for non-regrowing crops.
		result.totalProduced		= harvests * extraProduce // total of crops produced in xDays. If a crop generates more than 1 produce, fetch from crop.produce.extra
		result.totalHarvests		= harvests // for better clarity renaming to totalHarvests.
		result.producePerHarvest	= ( ( totalProduced / harvests) / initialPlanted ) // number of crops produced from each harvest from a single crop. This should always be 1, except for crops then generate more, like coffee beans.

		result.seedsProduced	= seedsProduced;
		result.seedsUsed		= seedsUsed;
		result.produceConverted = produceConverted;
		// Need to include predicted crop chance
	*/

	result.seedsProduced	= seedsProduced;
	result.seedsUsed		= seedsUsed;
	result.produceConverted = produceConverted;

	result.replanted		= replanted;
	result.totalPlanted		= initialPlanted + result.replanted; //UNSURE
	result.totalProduceSold	= (harvests + extraProduce) - result.produceConverted;
	result.totalProduced	= harvests + extraProduce;
	result.totalHarvests	= harvests / initialPlanted;
	result.producePerHarvest = result.totalProduced / harvests;
	
	result.extraProduceByChance	= extraProduceByChance;

	return result;
}

/*
 * Calculates the minimum cost of a single packet of seeds.
 * @param crop The crop object, containing all the crop data.
 * @return The minimum cost of a packet of seeds, taking options into account.
 */
function minSeedCost(crop) {
	var minSeedCost = Infinity;

	if (crop.seeds.pierre != 0 && options.seeds.pierre && crop.seeds.pierre < minSeedCost)
		minSeedCost = crop.seeds.pierre;
	if (crop.seeds.joja != 0 && options.seeds.joja && crop.seeds.joja < minSeedCost)
		minSeedCost = crop.seeds.joja;
	if (crop.seeds.special != 0 && options.seeds.special && crop.seeds.special < minSeedCost)
		minSeedCost = crop.seeds.special;
    if (minSeedCost == Infinity)
        minSeedCost = 0;
	
	return minSeedCost;
}

/*
 * Calculates the number of crops planted.
 * @param crop The crop object, containing all the crop data.
 * @return The number of crops planted, taking the desired number planted and the max seed money into account.
 */
function planted(crop) {
	if (options.buySeed && options.maxSeedMoney !== 0) {
		return Math.min(options.planted, Math.floor(options.maxSeedMoney / minSeedCost(crop)));
	} else {
		return options.planted;
	}
}

/*
 * Calculates the keg modifier for the crop.
 * @param crop The crop object, containing all the crop data.
 * @return The keg modifier.
 */
function getKegModifier(crop) {
    return crop.produce.kegType == "Wine" ? 3 : 2.25;
}

/*
 * Calculates the cask modifier for the crop.
 * @param crop The crop object, containing all the crop data.
 * @return The cask modifier.
 */
function getCaskModifier() {
    switch (options.aging) {
        case 1: return 1.25;
        case 2: return 1.5;
        case 3: return 2;
        default: return 1;
    }
}

/*
 * Calculates the profit for a specified crop.
 * @param crop The crop object, containing all the crop data.
 * @return The total profit.
 */
function profit(crop) {
	//Update verbiage for better clarity
	// We need to know if user chose to process and replant then profit will be on what was sold, removing crop transformed into seeds

	var num_planted = planted(crop);
    var total_harvest = num_planted;
	var total_crops = crop.harvests;
	var fertilizer = fertilizers[options.fertilizer];
	var produce = options.produce;
	var isTea = crop.name == "Tea Leaves";
	var isCoffee = crop.name == "Coffee Bean";

	const useLevel = options.level;
	const probability = (crop.isWildseed) ? PredictForaging(options.foragingLevel,options.skills.botanist) : Probability(useLevel+options.foodLevel,fertilizer.ratio);


	if (isTea) regular = 1, silver = gold = iridium = 0;
	var netIncome = 0;
	var maxNetIncome = 0;
	var netExpenses = 0;
	var totalProfit = 0;
	var maxTotalProfit = 0;
	var predNetIncome = 0;
	var totalReturnOnInvestment = 0;
	var averageReturnOnInvestment = 0;
	
	//Skip keg/jar calculations for ineligible crops (where corp.produce.jar or crop.produce.keg = 0)
	
	var userawproduce = false;

	//Produce Type: 0=Raw, 1=Jar, 2=Keg
	switch(produce) {
		case 1: 
			if(crop.produce.jarType == null) userawproduce = true;
			break;
		case 2:
			if(crop.produce.kegType == null) userawproduce = true;
			break;
	}
	
	var forSeeds = 0;
	if (options.replant && !isTea) {
		if (isCoffee && options.nextyear) {
			forSeeds = num_planted;
		} 
		else if (crop.growth.regrow > 0 && options.nextyear) {
			forSeeds = num_planted * 0.5;
		} 
		else if (crop.growth.regrow == 0) {
			forSeeds = num_planted * crop.harvests * 0.5;
			if(!options.nextyear && forSeeds >= 1) 
				forSeeds--;
		}
	}
	
	
	// Determine income of Raw Produce
	if (produce == 0 || userawproduce) {
        if (userawproduce && !options.sellRaw) {
            netIncome = 0;
        }
        else {
            var countN = Math.round(total_crops * probability.regular);
            var countS = Math.round(total_crops * probability.silver);
            var countG = Math.round(total_crops * probability.gold);
            var countI = Math.round(total_crops * probability.iridium);

            var countRegular = 0
            var countSilver = 0
            var countGold = 0
            var countIridium = 0
			//Probability of Quality
			// See Complete Formula here: https://stardewvalleywiki.com/Farming#Complete_Formula_2
			// Generate a random number between 0 and 1.
			
			//Quality is determined at harvest
			//For crops that produce multiples at harvest, fertilizers affect only the first crop produced

			//THIS IS WHERE WE NEED TO SETUP EXTRA CROPS PROBABILITY

			if(crop.produce.extra > 0){
				//take away extra crops toward quality prediction

			}

			for (let i = 0; i < total_crops; i++ ){
				const predicted = (crop.isWildseed) ? PredictForaging(options.foragingLevel,options.skills.botanist) : Predict(useLevel+options.foodLevel,fertilizer.ratio);
				
				switch(predicted.cropQuality){
					case 4:
						countIridium++
						break;
					case 2:
						countGold++
						break;
					case 1:
						countSilver++
						break;
					default:
						countRegular++
						break;
				}
			}

            predNetIncome += crop.produce.price * countRegular;
            predNetIncome += Math.trunc(crop.produce.price * 1.25) * countSilver;
            predNetIncome += Math.trunc(crop.produce.price * 1.5) * countGold;
            predNetIncome += crop.produce.price * 2 * countIridium;
			
			crop.produce.regular = countRegular
			crop.produce.silver = countSilver
			crop.produce.gold = countGold
			crop.produce.iridium = countIridium
			crop.produce.predNetIncome = predNetIncome

			//Apply quality to min/max profit (non predictive) value
			if (probability.iridium > 0){
				//min is always silver, max is always iridium
				netIncome += Math.trunc(crop.produce.price * 1.25) * total_crops;
				maxNetIncome += crop.produce.price * 2 * total_crops;
			} else {
				//min is always regular, max is always gold
				netIncome += crop.produce.price * total_crops;
				maxNetIncome += Math.trunc(crop.produce.price * 1.5) * total_crops;
			}

			//come back to this
            if (options.replant) {
                if (countN - forSeeds < 0) {
                    forSeeds -= countN;
                    countN = 0;
                }
                else {
                    countN -= forSeeds;
                    forSeeds = 0;
                }
                if (countS - forSeeds < 0) {
                    forSeeds -= countS;
                    countS = 0;
                }
                else {
                    countS -= forSeeds;
                    forSeeds = 0;
                }
                if (countG - forSeeds < 0) {
                    forSeeds -= countG;
                    countG = 0;
                }
                else {
                    countG -= forSeeds;
                    forSeeds = 0;
                }
                if (countI - forSeeds < 0) {
                    forSeeds -= countI;
                    countI = 0;
                }
                else {
                    countI -= forSeeds;
                    forSeeds = 0;
                }
            }

            if (options.skills.till) {
                netIncome *= 1.1;
				maxNetIncome *= 1.1
            }
        }
	}
    else if (produce == 3) {
        netIncome += 2 * (total_crops - forSeeds) * crop.seeds.sell;
    }
	else {
        var kegModifier = getKegModifier(crop);
        var caskModifier = getCaskModifier();

        var items = total_harvest;
        if (options.equipment > 0 && (options.produce == 1 || options.produce == 2)) {
            items = Math.min(options.equipment, total_harvest);
        }
		
		var excesseProduce = (total_harvest - items) * crop.harvests;
		if(excesseProduce < 0) 
			excesseProduce = 0;
		
		items = items * crop.harvests;
		
		if(excesseProduce < forSeeds)
			items = items - forSeeds + excesseProduce; //use unused produce for seeds
		
		if(items < 0) 
			items = 0; //because ancient fruit may not yield any produce resulting in negative profit
		

        if (options.produce == 1)
            netIncome += items * (crop.produce.jar != null ? crop.produce.jar : crop.produce.price * 2 + 50);
        else if (options.produce == 2)
            netIncome += items * (crop.produce.keg != null ? crop.produce.keg * caskModifier : crop.produce.price * kegModifier * caskModifier);
    
		if (options.skills.arti) {
			netIncome *= 1.4;
		}
	}

	// Determine expenses
	if (options.buySeed) {
		netExpenses += crop.seedLoss;
	}

	if (options.buyFert) {
		netExpenses += crop.fertLoss;
	}

	// Determine total profit
	totalProfit = netIncome + netExpenses;
	maxTotalProfit = maxNetIncome + netExpenses;
	predTotalProfit = predNetIncome + netExpenses;
	if (netExpenses != 0) {
		totalReturnOnInvestment = 100 * ((totalProfit) / -netExpenses); // Calculate the return on investment and scale it to a % increase

		//Calculate return on investment for each day produce grew 
		//LEFT OFF HERE
		if (crop.growth.regrow == 0) {
			averageReturnOnInvestment = (totalReturnOnInvestment / crop.growth.initial);
		}
		else {
			averageReturnOnInvestment = (totalReturnOnInvestment / options.days);
		}
	}
	else {
		totalReturnOnInvestment = 0;
		averageReturnOnInvestment = 0;
	}

    profitData = {}
	profitData.totalReturnOnInvestment = totalReturnOnInvestment;
	profitData.averageReturnOnInvestment = averageReturnOnInvestment;
	profitData.netExpenses = netExpenses;
    profitData.profit = totalProfit;
    profitData.maxProfit = maxTotalProfit;
	profitData.predTotalProfit = predTotalProfit

    profitData.regular = probability.regular;
    profitData.silver = probability.silver;
    profitData.gold = probability.gold;
    profitData.iridium = probability.iridium;

	return profitData;
}

/*
 * Calculates the loss to profit when seeds are bought.
 * @param crop The crop object, containing all the crop data.
 * @return The total loss.
 */
function seedLoss(crop) {
	const planted = Number(crop.totalPlanted);
	let seeds = planted;
	//if replanted > 0 then if replanted is greater than 0 then 'number of seeds = planted' + replanted else 'number of seeds = planted'
	// let seeds = (options.replant) ? planted : ( replanted > 0) ? planted + replanted : planted;

	//repurpose seeds
	if(options.replant){
		//how many produce were lost to convert to seeds
		let seedsUsed = Number(crop.seedsUsed);
		seeds = planted - seedsUsed;
	}

    let loss = -minSeedCost(crop);
	loss = loss * seeds;
	return loss;
}

/*
 * Calculates the loss to profit when fertilizer is bought.
 *
 * Note that harvesting does not destroy fertilizer, so this is
 * independent of the number of harvests.
 *
 * @param crop The crop object, containing all the crop data.
 * @return The total loss.
 */
function fertLoss(crop) {
	var loss;
	//If Deluxe && Sourve (seller) is Sandy
	if(options.fertilizer == 4 && options.fertilizerSource == 1)
		loss = -fertilizers[options.fertilizer].alternate_cost;
	else
		loss = -fertilizers[options.fertilizer].cost;
	return loss * Number(crop.totalPlanted);
}

/*
 * Converts any value to the average per day value based on total number produce grows for.
 * @param value The value to convert.
 * @return Value per day.
 */
function perDay(crop,choice) {
	//Growing Days = Days to Mature + ((Harvest Per Season -1 ) * Days to ReGrow)
	//Value Per Day = ((Harvest Per Season * Sell Price) -Seed Price) /Growing Days

	var growingDays =  crop.growth.initial + ((crop.harvests - 1) * crop.growth.regrow)
	var value = 0
	switch (choice) {
		case 0:	 //Profit by Day
			value = (options.buySeed) ? ((crop.harvests * crop.produce.price ) - -crop.seedLoss) / growingDays :(crop.harvests * crop.produce.price ) / growingDays;
			break;
		case 1: //Seed Loss by Day
			value = -crop.seedLoss / growingDays;
			break;
		case 2: // Fertilize Loss by Day
			value = -crop.fertLoss / growingDays;
			break;
	}
	return value;
}

/*
 * Performs filtering on a season's crop list, saving the new list to the cropList array.
 */
function fetchCrops() {
	cropList = [];

	var season = seasons[options.season];

	for (var i = 0; i < season.crops.length; i++) {
	    if ((options.seeds.pierre && season.crops[i].seeds.pierre != 0) ||
	    	(options.seeds.joja && season.crops[i].seeds.joja != 0) ||
    	    (options.seeds.special && season.crops[i].seeds.specialLoc != "")) {
	    	cropList.push(JSON.parse(JSON.stringify(season.crops[i])));
	    	cropList[cropList.length - 1].id = i;
		}
	}
}

/*
 * Calculates all profits and losses for all crops in the cropList array.
 */
function valueCrops() {
	for (var i = 0; i < cropList.length; i++) {
        if (cropList[i].isWildseed && options.skills.gatherer) {
            cropList[i].produce.extra += 1;
            cropList[i].produce.extraPerc += 0.2;
        }
		cropList[i].planted = planted(cropList[i]);
		var harvestsResults = harvests(cropList[i]);
		cropList[i].replanted 		= harvestsResults.replanted;
		cropList[i].totalPlanted 	= harvestsResults.totalPlanted;
		cropList[i].totalProduced 	= harvestsResults.totalProduced;
		cropList[i].totalProduceSold 	= harvestsResults.totalProduceSold;
		cropList[i].totalHarvests 	= harvestsResults.totalHarvests;
		cropList[i].harvests 		= harvestsResults.totalProduceSold;//...i hate this where are you being called?
		cropList[i].seedsProduced 	= harvestsResults.seedsProduced;
		cropList[i].seedsUsed 		= harvestsResults.seedsUsed;
		cropList[i].produceConverted 	= harvestsResults.produceConverted; 
		cropList[i].extraProduceByChance 	= harvestsResults.extraProduceByChance; 

	/* Available from harvestsResults
		result.replanted			= replanted * Initial Planted // Number of times crop was replanted times initial number planted
		result.totalPlanted			= initialPlanted + replanted // Total Number of times crop was planted for non-regrowing crops.
		result.totalProduced		= harvests * extraProduce // total of crops produced in xDays. If a crop generates more than 1 produce, fetch from crop.produce.extra
		result.totalHarvests		= harvests // for better clarity renaming to totalHarvests.
		result.producePerHarvest	= ( ( totalProduced / harvests) / initialPlanted ) // number of crops produced from each harvest from a single crop. This should always be 1, except for crops then generate more, like coffee beans.
		
		result.seedsProduced	= seedsProduced;
		result.seedsUsed		= seedsUsed;
		result.produceConverted = produceConverted;
		result.extraProduceByChance
		// Need to include predicted crop chance
	*/
		
		cropList[i].seedLoss = seedLoss(cropList[i]);
		cropList[i].fertLoss = fertLoss(cropList[i]);
		cropList[i].profitData = profit(cropList[i]);
		cropList[i].totalReturnOnInvestment = cropList[i].profitData.totalReturnOnInvestment;
		cropList[i].averageReturnOnInvestment = cropList[i].profitData.averageReturnOnInvestment;
		cropList[i].netExpenses = cropList[i].profitData.netExpenses;
		cropList[i].averageProfit = perDay(cropList[i],0); //profit
		cropList[i].averageSeedLoss = perDay(cropList[i],1); //seedLoss
		cropList[i].averageFertLoss = perDay(cropList[i],2); //fertLoss

		if (options.average == 1) {
			//Daily Profit
			cropList[i].drawProfit = cropList[i].averageProfit;
			cropList[i].drawSeedLoss = cropList[i].averageSeedLoss;
			cropList[i].drawFertLoss = cropList[i].averageFertLoss;
			graphDescription = "Daily Profit"
		}
		else if ((options.average == 2) ){
			//Total ROI
			if (options.buySeed || (options.buyFert && fertilizers[options.fertilizer].cost > 0)) {
				cropList[i].drawProfit = cropList[i].totalReturnOnInvestment;
				graphDescription = "Total Return On Investment";
			}
			else {
				cropList[i].drawProfit = 0;
				graphDescription = "Total Profit (Choose an expense for ROI)";
			}
			cropList[i].drawSeedLoss = cropList[i].seedLoss;
			cropList[i].drawFertLoss = cropList[i].fertLoss;
		}
		else if (options.average == 3) {
			//Daily ROI
			cropList[i].drawSeedLoss = cropList[i].averageSeedLoss;
			cropList[i].drawFertLoss = cropList[i].averageFertLoss;
			if (options.buySeed || (options.buyFert && fertilizers[options.fertilizer].cost > 0)) {
				cropList[i].drawProfit = cropList[i].averageReturnOnInvestment;
				graphDescription = "Daily Return On Investment";
			}
			else {
				cropList[i].drawProfit = 0;
				graphDescription = "Daily Profit (Choose an expense for ROI)";
			}
		}
		else {
			//Total Profit
			cropList[i].drawProfit = cropList[i].profitData.profit;
			cropList[i].drawSeedLoss = cropList[i].seedLoss;
			cropList[i].drawFertLoss = cropList[i].fertLoss;
			graphDescription = "Total Profit";
		}
	}
}

/*
 * Sorts the cropList array, so that the most profitable crop is the first one.
 */
function sortCrops() {
	var swapped;
    do {
        swapped = false;
        for (var i = 0; i < cropList.length - 1; i++) {
            if (cropList[i].drawProfit < cropList[i + 1].drawProfit) {
                var temp = cropList[i];
                cropList[i] = cropList[i + 1];
                cropList[i + 1] = temp;
                swapped = true;
            }
        }
    } while (swapped);


	// console.log("==== SORTED ====");
	for (var i = 0; i < cropList.length; i++) {
		// console.log(cropList[i].drawProfit.toFixed(2) + "  " + cropList[i].name);
	}
}

/*
 * Updates the X D3 scale.
 * @return The new scale.
 */
function updateScaleX() {
	return d3.scale.ordinal()
		.domain(d3.range(seasons[4].crops.length))
		.rangeRoundBands([0, width]);
}

/*
 * Updates the Y D3 scale.
 * @return The new scale.
 */
function updateScaleY() {
	return d3.scale.linear()
		.domain([0, d3.max(cropList, function(d) {
			if (d.drawProfit >= 0) {
				return (~~((d.drawProfit + 99) / 100) * 100);
			}
			else {
				var profit = d.drawProfit;
				if (options.buySeed) {
					if (d.seedLoss < profit)
						profit = d.drawSeedLoss;
				}
				if (options.buyFert) {
					if (d.fertLoss < profit)
						profit = d.drawFertLoss;
				}
				return (~~((-profit + 99) / 100) * 100);
			}
		})])
		.range([height, 0]);
}

/*
 * Updates the axis D3 scale.
 * @return The new scale.
 */
function updateScaleAxis() {
	return d3.scale.linear()
		.domain([
			-d3.max(cropList, function(d) {
				if (d.drawProfit >= 0) {
					return (~~((d.drawProfit + 99) / 100) * 100);
				}
				else {
					var profit = d.drawProfit;
					if (options.buySeed) {
						if (d.seedLoss < profit)
							profit = d.drawSeedLoss;
					}
					if (options.buyFert) {
						if (d.fertLoss < profit)
							profit = d.drawFertLoss;
					}
					return (~~((-profit + 99) / 100) * 100);
				}
			}),
			d3.max(cropList, function(d) {
				if (d.drawProfit >= 0) {
					return (~~((d.drawProfit + 99) / 100) * 100);
				}
				else {
					var profit = d.drawProfit;
					if (options.buySeed) {
						if (d.seedLoss < profit)
							profit = d.drawSeedLoss;
					}
					if (options.buyFert) {
						if (d.fertLoss < profit)
							profit = d.drawFertLoss;
					}
					return (~~((-profit + 99) / 100) * 100);
				}
			})])
		.range([height*2, 0]);
}
/*
* Checks if user is on mobile
* If true, mobile will disable click to link feature.
*/
function isMobile() {
    var match = window.matchMedia || window.msMatchMedia;
    if(match) {
        var mq = match("(pointer:coarse)");
        return mq.matches;
    }
    return false;
}

/*
 * Renders the graph.
 * This is called only when opening for the first time or when changing seasons/seeds.
 */
function renderGraph() {

	var x = updateScaleX();
	var y = updateScaleY();
	var ax = updateScaleAxis();

    var width = barOffsetX + barPadding * 2 + (barWidth + barPadding) * cropList.length + paddingLeft;
    if (width < svgMinWidth)
        width = svgMinWidth;
	svg.attr("width", width).style("padding-top", "12px");
	d3.select(".graph").attr("width", width);

	var yAxis = d3.svg.axis()
		.scale(ax)
		.orient("left")
		.tickFormat(d3.format(",s"))
		.ticks(16);

	axisY = gAxis.attr("class", "axis")
		.call(yAxis)
		.attr("transform", "translate(48, " + barOffsetY + ")");

	title = gTitle.attr("class", "Title")
		.append("text")
		.attr("class", "axis")
		.attr("x", 24)
		.attr("y", 12)
	 	.style("text-anchor", "start")
		.text(graphDescription);

	barsProfit = gProfit.selectAll("rect")
		.data(cropList)
		.enter()
		.append("rect")
			.attr("x", function(d, i) {
				if (d.drawProfit < 0 && options.buySeed && options.buyFert)
					return x(i) + barOffsetX + (barWidth / miniBar) * 2;
				else if (d.drawProfit < 0 && !options.buySeed && options.buyFert)
					return x(i) + barOffsetX + barWidth / miniBar;
				else if (d.drawProfit < 0 && options.buySeed && !options.buyFert)
					return x(i) + barOffsetX + barWidth / miniBar;
				else
					return x(i) + barOffsetX;
			})
			.attr("y", function(d) {
				if (d.drawProfit >= 0)
					return y(d.drawProfit) + barOffsetY;
				else
					return height + barOffsetY;
			})
			.attr("height", function(d) {
				if (d.drawProfit >= 0)
					return height - y(d.drawProfit);
				else
					return height - y(-d.drawProfit);
			})
			.attr("width", function(d) {
				if (d.drawProfit < 0 && options.buySeed && options.buyFert)
					return barWidth - (barWidth / miniBar) * 2;
				else if (d.drawProfit < 0 && !options.buySeed && options.buyFert)
					return barWidth - barWidth / miniBar;
				else if (d.drawProfit < 0 && options.buySeed && !options.buyFert)
					return barWidth - barWidth / miniBar;
				else
					return barWidth;
			})
 			.attr("fill", function (d) {
 				if (d.drawProfit >= 0)
 					return "lime";
 				else
 					return "red";
 			});

	barsSeed = gSeedLoss.selectAll("rect")
		.data(cropList)
		.enter()
		.append("rect")
			.attr("x", function(d, i) { return x(i) + barOffsetX; })
			.attr("y", height + barOffsetY)
			.attr("height", function(d) {
				if (options.buySeed)
					return height - y(-d.drawSeedLoss);
				else
					return 0;
			})
			.attr("width", barWidth / miniBar)
 			.attr("fill", "orange");

	barsFert = gFertLoss.selectAll("rect")
		.data(cropList)
		.enter()
		.append("rect")
			.attr("x", function(d, i) {
				if (options.buySeed)
					return x(i) + barOffsetX + barWidth / miniBar;
				else
					return x(i) + barOffsetX;
			})
			.attr("y", height + barOffsetY)
			.attr("height", function(d) {
				if (options.buyFert)
					return height - y(-d.drawFertLoss);
				else
					return 0;
			})
			.attr("width", barWidth / miniBar)
 			.attr("fill", "brown");

 	imgIcons = gIcons.selectAll("image")
		.data(cropList)
		.enter()
		.append("svg:image")
			.attr("x", function(d, i) { return x(i) + barOffsetX; })
			.attr("y", function(d) {
				if (d.drawProfit >= 0)
					return y(d.drawProfit) + barOffsetY - barWidth - barPadding;
				else
					return height + barOffsetY - barWidth - barPadding;
			})
		    .attr('width', barWidth)
		    .attr('height', barWidth)
		    .attr("xlink:href", function(d) { return "img/" + d.img; });

	barsTooltips = gTooltips.selectAll("rect")
		.data(cropList)
		.enter()
		.append("rect")
			.attr("x", function(d, i) { return x(i) + barOffsetX - barPadding/2; })
			.attr("y", function(d) {
				if (d.drawProfit >= 0)
					return y(d.drawProfit) + barOffsetY - barWidth - barPadding;
				else
					return height + barOffsetY - barWidth - barPadding;
			})
			.attr("height", function(d) {
				var topHeight = 0;

				if (d.drawProfit >= 0)
					topHeight = height + barWidth + barPadding - y(d.drawProfit);
				else
					topHeight = barWidth + barPadding;

				var lossArray = [0];

				if (options.buySeed)
					lossArray.push(d.drawSeedLoss);
				if (options.buyFert)
					lossArray.push(d.drawFertLoss);
				if (d.drawProfit < 0)
					lossArray.push(d.drawProfit);

				var swapped;
			    do {
			        swapped = false;
			        for (var i = 0; i < lossArray.length - 1; i++) {
			            if (lossArray[i] > lossArray[i + 1]) {
			                var temp = lossArray[i];
			                lossArray[i] = lossArray[i + 1];
			                lossArray[i + 1] = temp;
			                swapped = true;
			            }
			        }
			    } while (swapped);

			    return topHeight + (height - y(-lossArray[0]));
			})
			.attr("width", barWidth + barPadding)
 			.attr("opacity", "0")
 			.attr("cursor", "pointer")
			.on("mouseover", function(d) {
				tooltip.selectAll("*").remove();
				tooltip.style("visibility", "visible");
				// if (!isMobile()) {
				// 	document.addEventListener("click", function(d) { window.open(d.url, "_blank","popup"); });
				//   }
				  
			// .on("click", function(d) { window.open(d.url, "_blank"); });
				link = 
				tooltip.append("h2").attr("class", "tooltipTitle").text(d.name);
				var sortText ="";
				switch (options.average) {
					case 0: sortText = "Total Profit: " + formatNumber(d.drawProfit); break;
					case 1: sortText = "Daily Profit: "	+ formatNumber(d.drawProfit); break;
					case 2: sortText = "Total ROI: "	+ formatNumber(d.drawProfit) + "%"; break;
					case 3: sortText = "Daily ROI: "	+ formatNumber(d.drawProfit) + "%"; break;
				}
				// tooltip.append("h4").attr("class", "tooltipTitle").text(d.drawProfit);
				tooltip.append("h4").attr("class", "tooltipThCenter").text(sortText);

				var tooltipTable = tooltip.append("table")
					.attr("class", "tooltipTable")
					.attr("cellspacing", 0);
				var tooltipTr;

				//TEST
				// headers
				// tooltipTr = tooltipTable.append("thead").append("tr");
				// tooltipTr.append("th").attr("class", "tooltipThCenter").attr("colspan","2").text("Min Profit");
				// tooltipTr.append("th").attr("class", "tooltipThCenter").attr("colspan","2").text("Max Profit");

				// //body
				// tooltipBody = tooltipTable.append("tbody")
				// //Row 1
				// tooltipBodyTR = tooltipBody.append("tr")
				// tooltipBodyTR.append("td").attr("class", "tooltipTdLeft").text("Total");

				// if (d.minProfit > 0)
				// 	tooltipBodyTR.append("td").attr("class", "tooltipTdRightPos toolAlignRight").text(formatNumber(d.minProfit)).append("div").attr("class", "gold");
				// else
				// 	tooltipBodyTR.append("td").attr("class", "tooltipTdRightNeg toolAlignRight").text(formatNumber(d.minProfit)).append("div").attr("class", "gold");
				
				// tooltipBodyTR.append("td").attr("class", "tooltipTdLeft").text("Total");

				// if (d.maxProfit > 0)
				// 	tooltipBodyTR.append("td").attr("class", "tooltipTdRightPos toolAlignRight").text(formatNumber(d.maxProfit)).append("div").attr("class", "gold");
				// else
				// 	tooltipBodyTR.append("td").attr("class", "tooltipTdRightNeg toolAlignRight").text(formatNumber(d.maxProfit)).append("div").attr("class", "gold");
				// // tooltipBodyTR.append("td").attr("class", "tooltipTdRightPos toolAlignRight").text(formatNumber(d.maxProfit)).append("div").attr("class", "gold");

				// //Row 2
				// tooltipBodyTR = tooltipTable.append("tr")
				// tooltipBodyTR.append("td").attr("class", "tooltipTdLeft").text("Per Day");
				// tooltipBodyTR.append("td").attr("class", "tooltipTdRightPos toolAlignRight").text(formatNumber(d.averageProfit)).append("div").attr("class", "gold");
				// tooltipBodyTR.append("td").attr("class", "tooltipTdLeft").text("Per Day");
				// tooltipBodyTR.append("td").attr("class", "tooltipTdRightPos toolAlignRight").text(formatNumber(d.averageProfit)).append("div").attr("class", "gold");


				//----------


				//CHANGE THIS
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Total profit:");
				if (d.profitData.profit > 0)
					tooltipTr.append("td").attr("class", "tooltipTdRightPos").text("+" + formatNumber(d.profitData.profit))
						.append("div").attr("class", "gold");
				else
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.profitData.profit))
						.append("div").attr("class", "gold");

				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Profit per day:");
				if (d.averageProfit > 0)
					tooltipTr.append("td").attr("class", "tooltipTdRightPos").text("+" + formatNumber(d.averageProfit))
						.append("div").attr("class", "gold");
				else
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.averageProfit))
						.append("div").attr("class", "gold");

				if (options.buySeed || options.buyFert) {
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Return on investment:");
				if (d.totalReturnOnInvestment > 0)
					tooltipTr.append("td").attr("class", "tooltipTdRightPos").text("+" + formatNumber(d.totalReturnOnInvestment) + "%");
				else
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.totalReturnOnInvestment) + "%");

				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Return on investment per day:");
				if (d.averageReturnOnInvestment > 0)
					tooltipTr.append("td").attr("class", "tooltipTdRightPos").text("+" + formatNumber(d.averageReturnOnInvestment) + "%");
				else
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.averageReturnOnInvestment) + "%");
				}

				if (options.buySeed) {
					tooltipTr = tooltipTable.append("tr");
					tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("Total seed loss:");
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.seedLoss))
						.append("div").attr("class", "gold");

					tooltipTr = tooltipTable.append("tr");
					tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Seed loss per day:");
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.averageSeedLoss))
						.append("div").attr("class", "gold");
				}

				if (options.buyFert) {
					tooltipTr = tooltipTable.append("tr");
					tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("Total fertilizer loss:");
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.fertLoss))
						.append("div").attr("class", "gold");

					tooltipTr = tooltipTable.append("tr");
					tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Fertilizer loss per day:");
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.averageFertLoss))
						.append("div").attr("class", "gold");
				}


				//Ineligible crops are sold raw.
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("Produce sold:");
				switch (options.produce) {
					case 0: tooltipTr.append("td").attr("class", "tooltipTdRight").text("Raw crops"); break;
					case 1:
						if (d.produce.jarType != null)
							tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.jarType);
						else if (options.sellRaw)
                            tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text("Raw crops");
                        else
							tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text("None");
						break;
					case 2:
						if (d.produce.kegType != null)
							tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.kegType);
                        else if (options.sellRaw)
                            tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text("Raw crops");
						else
							tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text("None");
						break;
				}
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Duration:");
				tooltipTr.append("td").attr("class", "tooltipTdRight").text(options.days + " days");
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Planted:");
				tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.planted);
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Replanted:");
				tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.replanted);
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Harvests:");
				tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.totalHarvests);
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Total Produced:");
				tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.totalProduced);

				
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Seeds Used:");
				tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.seedsUsed);
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Seeds Produced:");
				tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.seedsProduced);

				
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Produce Converted to seed:");
				tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produceConverted);
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Produce Sold");
				tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.totalProduceSold);
				// //HERE I AM
				/*
					initialPlanted 		= crop.planted;
					harvests			= logically calculated // incremented by one each time a harvest has matured. This also reflects 1 produce was received. This will tell us how many times the player had to harvest for produce
					extraProduce		= logically calculated // if a crop as extra produce, increment extra by # of extra. This is not extra predicted produce!
					replanted			= logically calculated // Number of times crop was replanted to accommodate x Days. Incremented by one each time a harvest has matured for non-regrowing crops.
					
					result.replanted			= replanted * Initial Planted // Number of times crop was replanted times initial number planted
					result.totalPlanted			= initialPlanted + replanted // Total Number of times crop was planted for non-regrowing crops.
					result.totalProduced		= harvests * extraProduce // total of crops produced in xDays. If a crop generates more than 1 produce, fetch from crop.produce.extra
					result.totalHarvests		= harvests // for better clarity renaming to totalHarvests.
					result.producePerHarvest	= ( ( totalProduced / harvests) / initialPlanted ) // number of crops produced from each harvest from a single crop. This should always be 1, except for crops then generate more, like coffee beans.
					
					
					result.seedsProduced	= seedsProduced;
					result.seedsUsed		= seedsUsed;
					result.produceConverted = produceConverted;

					result.replanted		= replanted;
					result.totalPlanted		= initialPlanted + result.replanted; //UNSURE
					result.totalProduceSold	= (harvests + extraProduce) - result.produceConverted;
					result.totalProduced	= harvests + extraProduce;
					result.totalHarvests	= harvests;
					result.producePerHarvest = result.totalProduced / harvests;
									// Need to include predicted crop chance
				*/

				if (options.extra) {
                    var fertilizer = fertilizers[options.fertilizer];
                    var kegModifier = getKegModifier(d);
                    var caskModifier = getCaskModifier();
					var kegPrice = d.produce.keg != null ? d.produce.keg * caskModifier : d.produce.price * kegModifier * caskModifier;
                    var seedPrice = d.seeds.sell;
                    var initialGrow = 0;
                    if (options.skills.agri)
                        initialGrow += Math.floor(d.growth.initial * (fertilizer.growth - 0.1));
                    else
                        initialGrow += Math.floor(d.growth.initial * fertilizer.growth);

					tooltip.append("h3").attr("class", "tooltipTitleExtra").text("Crop info");
					tooltip.append("h4").attr("class", "tooltipThCenter").text("Predicted Total Profit: " + d.profitData.predTotalProfit); //COME BACK TO THIS
					// tooltipTable = tooltip.append("table")
					// 	.attr("class", "tooltipTable")
					// 	.attr("cellspacing", 0);


                    
					var tooltipTable = tooltip.append("table")
					.attr("class", "tooltipTableCenter")
					.attr("cellspacing", 0);
					var tooltipTr;

					switch(options.produce){
						case 1: //Jar

							tooltipTr = tooltipTable.append("tr");
							if (d.produce.jarType != null) {
								tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("Value (" + d.produce.jarType + "):");
								tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.price * 2 + 50)
								.append("div").attr("class", "gold");
							}
							else {
								tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("Value (Jar):");
								tooltipTr.append("td").attr("class", "tooltipTdRight").text("None");
							}
							break;
						case 2: //Keg
							tooltipTr = tooltipTable.append("tr");
							if (d.produce.kegType) {
								tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Value (" + d.produce.kegType + "):");
								tooltipTr.append("td").attr("class", "tooltipTdRight").text(Math.round(kegPrice))
								.append("div").attr("class", "gold");
							}
							else {
								tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Value (Keg):");
								tooltipTr.append("td").attr("class", "tooltipTdRight").text("None");
							}
							break;
						case 3: //Seeds
							tooltipTr = tooltipTable.append("tr");
							tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Value (Seeds):");
							tooltipTr.append("td").attr("class", "tooltipTdRight").text(seedPrice)
							.append("div").attr("class", "gold");
							break;
						default: //option 0 raw
							// if (!(d.isWildseed && options.skills.botanist)) {


							// 	tooltipTr = tooltipTable.append("tr");
							// 	tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Value (Normal):");
							// 	tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.price)
							// 		.append("div").attr("class", "gold");
							// 	tooltipTr.append("td").attr("class", "tooltipTdRight").text(" "+ d.produce.regular + " (" + (d.profitData.regular*100).toFixed(0) + "%)");
								
							// 	tooltipTr = tooltipTable.append("tr");
							// 	tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Extra Produce by " + (d.produce.extraPerc * 100) + "% chance: ");
							// 	tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.extraProduceByChance)

							// }
							// if (d.name != "Tea Leaves") {
							// 	if (!(d.isWildseed && options.skills.botanist)) {
							// 		tooltipTr = tooltipTable.append("tr");
							// 		tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Value (Silver):");
							// 		tooltipTr.append("td").attr("class", "tooltipTdRight").text(Math.trunc(d.produce.price * 1.25))
							// 			.append("div").attr("class", "gold");
							// 		tooltipTr.append("td").attr("class", "tooltipTdRight").text(" "+ d.produce.silver + " (" + (d.profitData.silver*100).toFixed(0) + "%)");
							// 		tooltipTr = tooltipTable.append("tr");
							// 		tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Value (Gold):");
							// 		tooltipTr.append("td").attr("class", "tooltipTdRight").text(Math.trunc(d.produce.price * 1.5))
							// 			.append("div").attr("class", "gold");
							// 		tooltipTr.append("td").attr("class", "tooltipTdRight").text(" "+ d.produce.gold + " (" + (d.profitData.gold*100).toFixed(0) + "%)");
							// 	}
							// 	if ((!d.isWildseed && fertilizers[options.fertilizer].ratio >= 3) || (d.isWildseed && options.skills.botanist)) {
							// 		tooltipTr = tooltipTable.append("tr");
							// 		tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Value (Iridium):");
							// 		tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.price * 2)
							// 			.append("div").attr("class", "gold");
							// 		tooltipTr.append("td").attr("class", "tooltipTdRight").text(" "+ d.produce.iridium + " (" + (d.profitData.iridium*100).toFixed(0) + "%)");
							// 	}
							// }
							// var tooltipTable = tooltip.append("table")
							// .attr("class", "tooltipTableCenter")
							// .attr("cellspacing", 0);
							// var tooltipTr;

							//TEST
							// headers
							tooltipTr = tooltipTable.append("thead").append("tr");
							tooltipTr.append("th").attr("class", "tooltipThCenter").text("Quality");
							tooltipTr.append("th").attr("class", "tooltipThCenter").text("Sell Price (Chance)");
							// tooltipTr.append("th").attr("class", "tooltipThCenter").text("Probability");
							tooltipTr.append("th").attr("class", "tooltipThCenter").text("Predicted");

							//body
							tooltipBody = tooltipTable.append("tbody");

							//Row 1
							tooltipBodyTR = tooltipBody.append("tr");
							tooltipBodyTR.append("td").attr("class", "tooltipTdCell").text("Normal");
							tooltipBodyTR.append("td").attr("class", "tooltipTdCell").text(d.produce.price + " (" + (d.profitData.regular*100).toFixed(0) + "%)").append("div").attr("class", "gold");
							tooltipBodyTR.append("td").attr("class", "tooltipTdCell").text(d.produce.regular);

							//Row 2
							tooltipBodyTR = tooltipBody.append("tr");
							tooltipBodyTR.append("td").attr("class", "tooltipTdLeft").text("Silver");
							tooltipBodyTR.append("td").attr("class", "tooltipTdRight").text(Math.trunc(d.produce.price * 1.25) + " (" + (d.profitData.silver*100).toFixed(0) + "%)").append("div").attr("class", "gold");
							tooltipBodyTR.append("td").attr("class", "tooltipTdRight").text(d.produce.silver);

							//Row 3
							tooltipBodyTR = tooltipBody.append("tr");
							tooltipBodyTR.append("td").attr("class", "tooltipTdLeft").text("Gold");
							tooltipBodyTR.append("td").attr("class", "tooltipTdRight").text(Math.trunc(d.produce.price * 1.5) + " (" + (d.profitData.gold*100).toFixed(0) + "%)").append("div").attr("class", "gold");
							tooltipBodyTR.append("td").attr("class", "tooltipTdRight").text(d.produce.gold);

							//Row 4
							tooltipBodyTR = tooltipBody.append("tr");
							tooltipBodyTR.append("td").attr("class", "tooltipTdLeft").text("Iridium");
							tooltipBodyTR.append("td").attr("class", "tooltipTdRight").text(Math.trunc(d.produce.price * 2) + " (" + (d.profitData.iridium*100).toFixed(0) + "%)").append("div").attr("class", "gold");
							tooltipBodyTR.append("td").attr("class", "tooltipTdRight").text(d.produce.iridium);


							tooltip.append("h3").attr("class", "tooltipTitle").text("Crop Predictions");
							// tooltip.append("h2").attr("class", "tooltipTitle").text(d.name);
							break;
					}


					var first = true;
					if (d.seeds.pierre > 0) {
						tooltipTr = tooltipTable.append("tr");
						tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("Seeds (Pierre):");
						first = false;
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.seeds.pierre)
						.append("div").attr("class", "gold");
					}
					if (d.seeds.joja > 0) {
						tooltipTr = tooltipTable.append("tr");
						if (first) {
							tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("Seeds (Joja):");
							first = false;
						}
						else
							tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Seeds (Joja):");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.seeds.joja)
						.append("div").attr("class", "gold");
					}
					if (d.seeds.special > 0) {
						tooltipTr = tooltipTable.append("tr");
						if (first) {
							tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("Seeds (Special):");
							first = false;
						}
						else
							tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Seeds (Special):");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.seeds.special)
						.append("div").attr("class", "gold");
						tooltipTr = tooltipTable.append("tr");
						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.seeds.specialLoc);
					}

					tooltipTr = tooltipTable.append("tr");
					tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("Time to grow:");
					tooltipTr.append("td").attr("class", "tooltipTdRight").text(initialGrow + " days");
					tooltipTr = tooltipTable.append("tr");
					tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Time to regrow:");
					if (d.growth.regrow > 0)
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.growth.regrow + " days");
					else
						tooltipTr.append("td").attr("class", "tooltipTdRight").text("N/A");
					if (d.produce.extra > 0) {
						tooltipTr = tooltipTable.append("tr");
						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Extra produce:");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.extra);
						tooltipTr = tooltipTable.append("tr");
						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("Extra chance:");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text((d.produce.extraPerc * 100) + "%");
					}



				}
			})
			.on("mousemove", function() {
				tooltip.style("top", (d3.event.pageY - 16) + "px").style("left",(d3.event.pageX + 20) + "px");
			})
			.on("mouseout", function() { tooltip.style("visibility", "hidden"); })
			//TURN THIS BACK ON WHEN DONE TESTING
			.on("click", function(d) { 
				if(!options.disableLinks)
					window.open(d.url, "_blank"); 
			});

}

/*
 * Updates the already rendered graph, showing animations.
 */
function updateGraph() {
	var x = updateScaleX();
	var y = updateScaleY();
	var ax = updateScaleAxis();

	var yAxis = d3.svg.axis()
		.scale(ax)
		.orient("left")
		.tickFormat(d3.format(",s"))
		.ticks(16);

	axisY.transition()
		.call(yAxis);

	title = gTitle.attr("class", "Title")
	.append("text")
	.attr("class", "axis")
	.attr("x", 24)
    .attr("y", 12)
	.style("text-anchor", "start")
	.text(graphDescription);

	barsProfit.data(cropList)
		.transition()
			.attr("x", function(d, i) {
				if (d.drawProfit < 0 && options.buySeed && options.buyFert)
					return x(i) + barOffsetX + (barWidth / miniBar) * 2;
				else if (d.drawProfit < 0 && !options.buySeed && options.buyFert)
					return x(i) + barOffsetX + barWidth / miniBar;
				else if (d.drawProfit < 0 && options.buySeed && !options.buyFert)
					return x(i) + barOffsetX + barWidth / miniBar;
				else
					return x(i) + barOffsetX;
			})
			.attr("y", function(d) {
				if (d.drawProfit >= 0)
					return y(d.drawProfit) + barOffsetY;
				else
					return height + barOffsetY;
			})
			.attr("height", function(d) {
				if (d.drawProfit >= 0)
					return height - y(d.drawProfit);
				else
					return height - y(-d.drawProfit);
			})
			.attr("width", function(d) {
				if (d.drawProfit < 0 && options.buySeed && options.buyFert)
					return barWidth - (barWidth / miniBar) * 2;
				else if (d.drawProfit < 0 && !options.buySeed && options.buyFert)
					return barWidth - barWidth / miniBar;
				else if (d.drawProfit < 0 && options.buySeed && !options.buyFert)
					return barWidth - barWidth / miniBar;
				else
					return barWidth;
			})
 			.attr("fill", function (d) {
 				if (d.drawProfit >= 0)
 					return "lime";
 				else
 					return "red";
 			});

	barsSeed.data(cropList)
		.transition()
			.attr("x", function(d, i) { return x(i) + barOffsetX; })
			.attr("y", height + barOffsetY)
			.attr("height", function(d) {
				if (options.buySeed)
					return height - y(-d.drawSeedLoss);
				else
					return 0;
			})
			.attr("width", barWidth / miniBar)
 			.attr("fill", "orange");

	barsFert.data(cropList)
		.transition()
			.attr("x", function(d, i) {
				if (options.buySeed)
					return x(i) + barOffsetX + barWidth / miniBar;
				else
					return x(i) + barOffsetX;
			})
			.attr("y", height + barOffsetY)
			.attr("height", function(d) {
				if (options.buyFert)
					return height - y(-d.drawFertLoss);
				else
					return 0;
			})
			.attr("width", barWidth / miniBar)
 			.attr("fill", "brown");

 	imgIcons.data(cropList)
		.transition()
			.attr("x", function(d, i) { return x(i) + barOffsetX; })
			.attr("y", function(d) {
				if (d.drawProfit >= 0)
					return y(d.drawProfit) + barOffsetY - barWidth - barPadding;
				else
					return height + barOffsetY - barWidth - barPadding;
			})
		    .attr('width', barWidth)
		    .attr('height', barWidth)
		    .attr("xlink:href", function(d) { return "img/" + d.img; });
			// .on("click", function(d) { window.open(d.url, "_blank"); });

	barsTooltips.data(cropList)
		.transition()
			.attr("x", function(d, i) { return x(i) + barOffsetX - barPadding/2; })
			.attr("y", function(d) {
				if (d.drawProfit >= 0)
					return y(d.drawProfit) + barOffsetY - barWidth - barPadding;
				else
					return height + barOffsetY - barWidth - barPadding;
			})
			.attr("height", function(d) {
				var topHeight = 0;

				if (d.drawProfit >= 0)
					topHeight = height + barWidth + barPadding - y(d.drawProfit);
				else
					topHeight = barWidth + barPadding;

				var lossArray = [0];

				if (options.buySeed)
					lossArray.push(d.drawSeedLoss);
				if (options.buyFert)
					lossArray.push(d.drawFertLoss);
				if (d.drawProfit < 0)
					lossArray.push(d.drawProfit);

				var swapped;
			    do {
			        swapped = false;
			        for (var i = 0; i < lossArray.length - 1; i++) {
			            if (lossArray[i] > lossArray[i + 1]) {
			                var temp = lossArray[i];
			                lossArray[i] = lossArray[i + 1];
			                lossArray[i + 1] = temp;
			                swapped = true;
			            }
			        }
			    } while (swapped);

			    return topHeight + (height - y(-lossArray[0]));
			})
			.attr("width", barWidth + barPadding);
}

function updateSeasonNames() {
    if (options.crossSeason) {
        document.getElementById('season_0').innerHTML = "Spring & Summer";
        document.getElementById('season_1').innerHTML = "Summer & Fall";
        document.getElementById('season_2').innerHTML = "Fall & Winter";
        document.getElementById('season_3').innerHTML = "Winter & Spring";
    }
    else {
        document.getElementById('season_0').innerHTML = "Spring";
        document.getElementById('season_1').innerHTML = "Summer";
        document.getElementById('season_2').innerHTML = "Fall";
        document.getElementById('season_3').innerHTML = "Winter";
    }
}

/*
 * Updates all options and data, based on the options set in the HTML.
 * After that, filters, values and sorts all the crops again.
 */
function updateData() {

    options.season = parseInt(document.getElementById('select_season').value);
    const isGreenhouse = options.season == 4;

	options.produce = parseInt(document.getElementById('select_produce').value);

    if (options.produce == 0 || options.produce == 3) {
        document.getElementById('check_sellRaw').disabled = true;
        document.getElementById('check_sellRaw').style.cursor = "default";
    }
    else {
        document.getElementById('check_sellRaw').disabled = false;
        document.getElementById('check_sellRaw').style.cursor = "pointer";
    }
    options.sellRaw = document.getElementById('check_sellRaw').checked;

    if (options.produce == 0 || options.produce == 3) {
        document.getElementById('equipment').disabled = true;
        document.getElementById('equipment').style.cursor = "default";
    }
    else {
        document.getElementById('equipment').disabled = false;
        document.getElementById('equipment').style.cursor = "text";
    }
    if (document.getElementById('equipment').value < 0)
        document.getElementById('equipment').value = 0;
    options.equipment = parseInt(document.getElementById('equipment').value);

    if (options.produce == 2) {
        document.getElementById('select_aging').disabled = false;
        document.getElementById('select_aging').style.cursor = "pointer";
    }
    else {
        document.getElementById('select_aging').disabled = true;
        document.getElementById('select_aging').style.cursor = "default";
        document.getElementById('select_aging').value = 0;
    }
    options.aging = parseInt(document.getElementById('select_aging').value);

	if (document.getElementById('max_seed_money').value < 0)
		document.getElementById('max_seed_money').value = '0';
	options.maxSeedMoney = parseInt(document.getElementById('max_seed_money').value);
	if (isNaN(options.maxSeedMoney)) {
		options.maxSeedMoney = 0;
	}

	options.average = parseInt(document.getElementById('select_profit_display').value);
    
    options.crossSeason = document.getElementById('cross_season').checked;

    if (!isGreenhouse) {
        document.getElementById('number_days').disabled = true;
        document.getElementById('cross_season').disabled = false;
        document.getElementById('cross_season').style.cursor = "pointer";
        document.getElementById('current_day').disabled = false;
        document.getElementById('current_day').style.cursor = "text";

        if (document.getElementById('current_day').value <= 0)
            document.getElementById('current_day').value = 1;
        if (options.crossSeason) {
            document.getElementById('number_days').value = 56;
            if (document.getElementById('current_day').value > 56)
                document.getElementById('current_day').value = 56;
            options.days = 57 - document.getElementById('current_day').value;
        }
        else {
            document.getElementById('number_days').value = 28;
            if (document.getElementById('current_day').value > 28)
                  document.getElementById('current_day').value = 28;
            options.days = 29 - document.getElementById('current_day').value;
        }
    } else {
        document.getElementById('number_days').disabled = false;
        document.getElementById('cross_season').disabled = true;
        document.getElementById('cross_season').style.cursor = "default";
        document.getElementById('current_day').disabled = true;
        document.getElementById('current_day').style.cursor = "default";
        
        document.getElementById('current_day').value = 1;

        if (document.getElementById('number_days').value > 100000)
            document.getElementById('number_days').value = 100000;
        options.days = document.getElementById('number_days').value;
    }

	options.seeds.pierre = document.getElementById('check_seedsPierre').checked;
	options.seeds.joja = document.getElementById('check_seedsJoja').checked;
	options.seeds.special = document.getElementById('check_seedsSpecial').checked;

	options.buySeed = document.getElementById('check_buySeed').checked;

    options.replant = document.getElementById('check_replant').checked;

    if (!options.replant || isGreenhouse) {
        document.getElementById('check_nextyear').disabled = true;
        document.getElementById('check_nextyear').style.cursor = "default";
        document.getElementById('check_nextyear').checked = false;
    }
    else {
        document.getElementById('check_nextyear').disabled = false;
        document.getElementById('check_nextyear').style.cursor = "pointer";
    }
    options.nextyear = document.getElementById('check_nextyear').checked;

    if (document.getElementById('number_planted').value <= 0)
        document.getElementById('number_planted').value = 1;
	//Better to explain in UI that this will update the number of crops to an even number!
    // if (options.replant && parseInt(document.getElementById('number_planted').value) % 2 == 1)
    //     document.getElementById('number_planted').value = parseInt(document.getElementById('number_planted').value) + 1;
    options.planted = document.getElementById('number_planted').value;

	options.fertilizer = parseInt(document.getElementById('select_fertilizer').value);

	options.buyFert = document.getElementById('check_buyFert').checked;
	
	options.fertilizerSource = parseInt(document.getElementById('speed_gro_source').value);

	if (document.getElementById('farming_level').value <= 0)
		document.getElementById('farming_level').value = 0;
	if (document.getElementById('farming_level').value > 14)
		document.getElementById('farming_level').value = 14;
	options.level = parseInt(document.getElementById('farming_level').value);

	if (options.level >= 5) {
		document.getElementById('check_skillsTill').disabled = false;
		document.getElementById('check_skillsTill').style.cursor = "pointer";
		options.skills.till = document.getElementById('check_skillsTill').checked;
	}
	else {
		document.getElementById('check_skillsTill').disabled = true;
		document.getElementById('check_skillsTill').style.cursor = "default";
		document.getElementById('check_skillsTill').checked = false;
	}

	if (options.level >= 10 && options.skills.till) {
		document.getElementById('select_skills').disabled = false;
		document.getElementById('select_skills').style.cursor = "pointer";
	}
	else {
		document.getElementById('select_skills').disabled = true;
		document.getElementById('select_skills').style.cursor = "default";
		document.getElementById('select_skills').value = 0;
	}
	if (document.getElementById('select_skills').value == 1) {
		options.skills.agri = true;
		options.skills.arti = false;
	}
	else if (document.getElementById('select_skills').value == 2) {
		options.skills.agri = false;
		options.skills.arti = true;
	}
	else {
		options.skills.agri = false;
		options.skills.arti = false;
	}

    if (document.getElementById('foraging_level').value <= 0)
        document.getElementById('foraging_level').value = 0;
    if (document.getElementById('foraging_level').value > 14)
        document.getElementById('foraging_level').value = 14;
    options.foragingLevel = parseInt(document.getElementById('foraging_level').value);

    if (options.foragingLevel >= 5) {
        document.getElementById('check_skillsGatherer').disabled = false;
        document.getElementById('check_skillsGatherer').style.cursor = "pointer";
    }
    else {
        document.getElementById('check_skillsGatherer').disabled = true;
        document.getElementById('check_skillsGatherer').style.cursor = "default";
        document.getElementById('check_skillsGatherer').checked = false;
    }
    options.skills.gatherer = document.getElementById('check_skillsGatherer').checked;

    if (options.foragingLevel >= 10 && options.skills.gatherer) {
        document.getElementById('check_skillsBotanist').disabled = false;
        document.getElementById('check_skillsBotanist').style.cursor = "pointer";
    }
    else {
        document.getElementById('check_skillsBotanist').disabled = true;
        document.getElementById('check_skillsBotanist').style.cursor = "default";
        document.getElementById('check_skillsBotanist').checked = false;
    }
    options.skills.botanist = document.getElementById('check_skillsBotanist').checked;

	options.foodIndex = document.getElementById('select_food').value;
	options.foodLevel = parseInt(document.getElementById('select_food').options[options.foodIndex].value);
	if (options.buyFert && options.fertilizer == 4)
		document.getElementById('speed_gro_source').disabled = false;
	else
		document.getElementById('speed_gro_source').disabled = true;

	options.extra = document.getElementById('check_extra').checked;
	options.disableLinks = document.getElementById('disable_links').checked;

    updateSeasonNames();

	// Persist the options object into the URL hash.
	window.location.hash = encodeURIComponent(serialize(options));

	fetchCrops();
	valueCrops();
	sortCrops();
}

/*
 * Called once on startup to draw the UI.
 */
function initial() {
	optionsLoad();
	updateData();
	renderGraph();
}

/*
 * Called on every option change to animate the graph.
 */
function refresh() {
	updateData();
	gTitle.selectAll("*").remove();
	updateGraph();
}

/*
 * Parse out and validate the options from the URL hash.
 */
function optionsLoad() {
	if (!window.location.hash) return;

	options = deserialize(window.location.hash.slice(1));

	function validBoolean(q) {

		return q == 1;
	}

	function validIntRange(min, max, num) {

		return num < min ? min : num > max ? max : parseInt(num, 10);
	}

	options.season = validIntRange(0, 4, options.season);
	document.getElementById('select_season').value = options.season;

	options.produce = validIntRange(0, 3, options.produce);
	document.getElementById('select_produce').value = options.produce;

    options.equipment = validIntRange(0, MAX_INT, options.equipment);
    document.getElementById('equipment').value = options.equipment;

    options.sellRaw = validBoolean(options.sellRaw);
    document.getElementById('check_sellRaw').checked = options.sellRaw;

    options.aging = validIntRange(0, 3, options.aging);
    document.getElementById('select_aging').value = options.aging;

	options.planted = validIntRange(1, MAX_INT, options.planted);
	document.getElementById('number_planted').value = options.planted;

    options.maxSeedMoney = validIntRange(0, MAX_INT, options.maxSeedMoney);
    document.getElementById('max_seed_money').value = options.maxSeedMoney;

	options.average = validIntRange(0,3,options.average);
	document.getElementById('select_profit_display').checked = options.average;

    options.crossSeason = validBoolean(options.crossSeason);
    document.getElementById('cross_season').checked = options.crossSeason;

    var daysMax = 0;
    if (options.crossSeason)
        daysMax = options.season === 4 ? MAX_INT : 56;
    else
        daysMax = options.season === 4 ? MAX_INT : 28;

    options.days = validIntRange(1, daysMax, options.days);
    if (options.season === 4) {
        document.getElementById('number_days').value = options.days;
    } 
    else {
        if (options.crossSeason) {
            document.getElementById('number_days').value = 56;
            document.getElementById('current_day').value = 57 - options.days;
        }
        else {
            document.getElementById('number_days').value = 28;
            document.getElementById('current_day').value = 29 - options.days;
        }
    }

	options.seeds.pierre = validBoolean(options.seeds.pierre);
	document.getElementById('check_seedsPierre').checked = options.seeds.pierre;

	options.seeds.joja = validBoolean(options.seeds.joja);
	document.getElementById('check_seedsJoja').checked = options.seeds.joja;

	options.seeds.special = validBoolean(options.seeds.special);
	document.getElementById('check_seedsSpecial').checked = options.seeds.special;

	options.buySeed = validBoolean(options.buySeed);
	document.getElementById('check_buySeed').checked = options.buySeed;

    options.replant = validBoolean(options.replant);
    document.getElementById('check_replant').checked = options.replant;

    options.nextyear = validBoolean(options.nextyear);
    document.getElementById('check_nextyear').checked = options.nextyear;

	options.fertilizer = validIntRange(0, 6, options.fertilizer);
	document.getElementById('select_fertilizer').value = options.fertilizer;

    options.fertilizerSource = validIntRange(0, 1, options.fertilizerSource);
    document.getElementById('speed_gro_source').value = options.fertilizerSource;

	options.buyFert = validBoolean(options.buyFert);
	document.getElementById('check_buyFert').checked = options.buyFert;

	options.level = validIntRange(0, 13, options.level);
	document.getElementById('farming_level').value = options.level;

	options.skills.till = validBoolean(options.skills.till);
	document.getElementById('check_skillsTill').checked = options.skills.till;

	options.skills.agri = validBoolean(options.skills.agri);
	options.skills.arti = validBoolean(options.skills.arti);
	const binaryFlags = options.skills.agri + options.skills.arti * 2;
	document.getElementById('select_skills').value = binaryFlags;

    options.foragingLevel = validIntRange(0, 13, options.foragingLevel);
    document.getElementById('foraging_level').value = options.foragingLevel;

    options.skills.gatherer = validBoolean(options.skills.gatherer);
    document.getElementById('check_skillsGatherer').checked = options.skills.gatherer;

    options.skills.botanist = validBoolean(options.skills.botanist);
    document.getElementById('check_skillsBotanist').checked = options.skills.botanist;

	options.foodIndex = validIntRange(0, 6, options.foodIndex);
	document.getElementById('select_food').value = options.foodIndex;

	options.extra = validBoolean(options.extra);
	document.getElementById('check_extra').checked = options.extra;

	options.disableLinks = validBoolean(options.disableLinks);
	document.getElementById('disable_links').checked = options.disableLinks;

    updateSeasonNames();
}

function deserialize(str) {
    var json = `(${str})`
        .replace(/_/g, ' ')
        .replace(/-/g, ',')
        .replace(/\(/g, '{')
        .replace(/\)/g, '}')
        .replace(/([a-z]+)/gi, '"$1":')
        .replace(/"(true|false)":/gi, '$1');

    //console.log(json);

	return JSON.parse(json);
}

function serialize(obj) {

	return Object.keys(obj)
		.reduce((acc, key) => {
			return /^(?:true|false|\d+)$/i.test('' + obj[key])
				? `${acc}-${key}_${obj[key]}`
				: `${acc}-${key}_(${serialize(obj[key])})`;
		}, '')
		.slice(1);
}

/*
 * Called when changing season/seeds, to redraw the graph.
 */
function rebuild() {
	gAxis.selectAll("*").remove();
	gProfit.selectAll("*").remove();
	gSeedLoss.selectAll("*").remove();
	gFertLoss.selectAll("*").remove();
	gIcons.selectAll("*").remove();
	gTooltips.selectAll("*").remove();
	gTitle.selectAll("*").remove();

	updateData();
	renderGraph();
}

document.addEventListener('DOMContentLoaded', initial);
document.addEventListener('click', function (event) {
	if (event.target.id === 'reset') window.location = 'index.html';
});
