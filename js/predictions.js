

function Clamp(value, min, max){
	if (max < min)
	{
		let num = min;
		min = max;
		max = num;
	}
	if (value < min)
	{
		value = min;
	}
	if (value > max)
	{
		value = max;
	}
	return value;
}

/*
 * Calculates the chance of crop quality based on foraging level and foraging skill botanist.
 * Math is from decompiled 1.6 game data
 *
 * @param foragingLevel The level of the Players foraging skill (0-15)
 * @param botanist If botanist skill option is checked (True|False)
 * @return Object returning predicted crop quality and probability of potential qualities.
 */
function PredictForaging(foragingLevel,botanist){
	let chance = {};

	// All wild crops are iridium if botanist is selected
	let forIridiumQuality = (botanist) ? 1 : 0;
	let forGoldQuality = foragingLevel / 30;
	let forSilverQuality = (1 - forGoldQuality) * (foragingLevel / 15);
	let forRegularQuality = (1 - forGoldQuality) * (1 - (foragingLevel / 15));

	const r = Math.random(); //whats the max number usable here

	//Regular
	let cropQuality = 0;
	if (botanist){
		//iridium
		cropQuality = 4;
	} else if (r < (foragingLevel / 30)){
		//gold
		cropQuality = 2;
	} else if (r < (foragingLevel / 15)){
		//silver
		cropQuality = 1;
	}

	chance.iridium 		= forIridiumQuality;
	chance.gold 		= forGoldQuality;
	chance.silver 		= forSilverQuality;
	chance.regular 		= forRegularQuality;
	chance.cropQuality 	= cropQuality;

	return chance;
}

/*
 * Calculates the chance of crop quality based on farmingLevel level and grade of fertilizer.
 * Math is from decompiled 1.6 game data
 *
 * @param farmingLevel The level of the Players farming skill (0-14)
 * @param fertilizerQualityLevel Quality of Fertilizer (0:Normal, 1:Silver, 2:Gold, 3:Iridium)
 * @return Object returning predicted crop quality and part of probability of potential qualities.
 */
function Predict(farmingLevel, fertilizerQualityLevel){
  var r2 = Math.random();
  let chance = {};

	let forRegularQuality	  = 0;
	let forGoldQuality      = 0.2 * (farmingLevel / 10.0) + 0.2 * fertilizerQualityLevel * ((farmingLevel + 2.0) / 12.0) + 0.01;
	let forSilverQuality 	  = Math.min(0.75, forGoldQuality * 2.0);
	let forIridiumQuality 	= 0;
	
	if(fertilizerQualityLevel < 3){
		forRegularQuality = 1 - (forSilverQuality + forGoldQuality);
	}
	if(fertilizerQualityLevel >= 3){
		forIridiumQuality = forGoldQuality / 2.0;
	}

  //Regular
	let cropQuality = 0;
	if (fertilizerQualityLevel >= 3 && r2 < forGoldQuality / 2.0)
	{
		//iridium
		cropQuality = 4;
	}
	else if (r2 < forGoldQuality)
	{
		//Gold
		cropQuality = 2;
	}
	else if (r2 < forSilverQuality || fertilizerQualityLevel >= 3)
	{
		//Silver
		cropQuality = 1;
	}
	/* Code by ConcernedApe END */
	
	let minQuailty = 0;
	let maxQuailty = 3;
	if (fertilizerQualityLevel >= 3){
		minQuailty = 1;
	 	maxQuailty = 4;
	}
	cropQuality = Clamp(cropQuality, minQuailty, maxQuailty);

  chance.forRegularQuality = forRegularQuality;
  chance.forSilverQuality = forSilverQuality;
  chance.forGoldQuality = forGoldQuality;
  chance.forIridiumQuality = forIridiumQuality;
  chance.cropQuality = cropQuality;

  return chance;
}

/*
 * Calculates the chance of crop quality based on farmingLevel level and grade of fertilizer.
 * Math is from decompiled 1.6 game data
 *
 * @param farmingLevel The level of the Players farming skill (0-14)
 * @param fertilizerQualityLevel Quality of Fertilizer (0:Normal, 1:Silver, 2:Gold, 3:Iridium)
 * @return Object returning predicted crop quality and part of probability of potential qualities.
 */
function Probability( farmingLevel,  fertilizerQualityLevel){
	const chance = Predict(farmingLevel,fertilizerQualityLevel);
    let probability = {};
		
	let probabilityIridiumWillOccur 	= chance.forIridiumQuality;
	let probabilityIridiumWillNot	= 1 - probabilityIridiumWillOccur;
	
	let probabilityGoldWillOccur = (fertilizerQualityLevel >= 3) ? chance.forGoldQuality * probabilityIridiumWillNot : chance.forGoldQuality;
	let probabilityGoldWillNot 	= 1 - chance.forGoldQuality;
	
	let probabilitySilverWillOccur 	= probabilityGoldWillNot * chance.forSilverQuality;
	let probabilitySilverWillNot	 	= 1 - chance.forSilverQuality;
	if(fertilizerQualityLevel >= 3){
		probabilitySilverWillOccur = (probabilityGoldWillNot * probabilityIridiumWillNot < 0) ? 0.00 : probabilityGoldWillNot * probabilityIridiumWillNot;
	}
	
	let probabilityRegularWillOccur = (fertilizerQualityLevel < 3) ? probabilityGoldWillNot * probabilitySilverWillNot : 0.00;
	
	//OUTPUT One Result Probability
		// console.log("~*~*~Probability of Crop Quality~*~*~\n");

		// console.log("Farming Level:\t\t%f",farmingLevel);
		// console.log("Fertilizer Level:\t%f\n",fertilizerQualityLevel);

		// console.log("Iridium:\t",probabilityIridiumWillOccur*100);
		// console.log("Gold:\t",probabilityGoldWillOccur*100);
		// console.log("Silver:\t",probabilitySilverWillOccur*100);
		// console.log("Regular:\t",probabilityRegularWillOccur*100);
		// console.log("~~~~~~~~~~~~~~~~~\n\n");


    probability.iridium = probabilityIridiumWillOccur;
    probability.gold = probabilityGoldWillOccur;
    probability.silver = probabilitySilverWillOccur;
    probability.regular = probabilityRegularWillOccur;
		
	return probability;
		
}