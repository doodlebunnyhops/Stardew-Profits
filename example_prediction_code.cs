using System;

/*playground using .NET 8
 https://dotnetfiddle.net/ 
*/

public class Program
{
	public static int Clamp(int value, int min, int max)
	{
		if (max < min)
		{
			int num = min;
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
		
		//Fertilizer
		// normal = 0
		// basic = 1
		// quality = 2
		// deluxe = 3
		
		//Crop
		// normal = 0
		// silver = 1
		// gold = 2
		// iridium = 4
	
	public static (double chanceForRegularQuality,double chanceForSilverQuality,double chanceForGoldQuality,double chanceForIridiumQuality) PredictForage(int foragingLevel, Boolean botanist, Boolean output){
		// All wild crops are iridium if botanist is selected
		double chanceForIridiumQuality = (botanist) ? 1 : 0;
		double chanceForGoldQuality = (double)((float)foragingLevel / 30f);
		double chanceForSilverQuality = (1 - chanceForGoldQuality) * (double)((float)foragingLevel / 15f);
		double chanceForRegularQuality = (1 - chanceForGoldQuality) * (1 - (double)((float)foragingLevel / 15f));
		
		/* Code by ConcernedApe with slight modifications*/
		Random r = new Random(); //whats the max number usable here
		
		//TEST LOG OUTPUT
		Console.WriteLine("ForagingLevel:\t{0}",foragingLevel);
		Console.WriteLine("RandomNumber:\t\t{0}",r.NextDouble());
		Console.WriteLine("chanceForRegularQuality:\t{0:F}%",chanceForRegularQuality * 100);
		Console.WriteLine("chanceForSilverQuality:\t{0:F}%",chanceForSilverQuality * 100);
		Console.WriteLine("chanceForGoldQuality:\t{0:F}%",chanceForGoldQuality * 100);
		Console.WriteLine("chanceForIridiumQuality:\t\t{0:F}%\n\n",chanceForIridiumQuality * 100);
		
		//Regular
		int cropQuality = 0;
		if (botanist){
			//iridium
			cropQuality = 4;
		} else if (r.NextDouble() < (double)((float)foragingLevel / 30f)){
			//gold
			cropQuality = 2;
		} else if (r.NextDouble() < (double)((float)foragingLevel / 15f)){
			//silver
			cropQuality = 1;
		}
		
		if(output){
			Console.WriteLine("~*~*~Predicted Crop Quality~*~*~\n");
			Console.WriteLine("ForagingLevel:\t{0}",foragingLevel);
			Console.WriteLine("isBotanist:\t{0}",botanist);
			switch(cropQuality){
				case 0:
					Console.WriteLine("Crop Quality:\tRegular\n");
					break;
				case 1:
					Console.WriteLine("Crop Quality:\tSilver\n");
					break;
				case 2:
					Console.WriteLine("Crop Quality:\tGold\n");
					break;
				case 3:
					Console.WriteLine("Crop Quality:\t??\n");
					break;
				case 4:
					Console.WriteLine("Crop Quality:\tIridium\n");
					break;
			}	
			Console.WriteLine("~~~~~~~~~~~~~~~~~\n\n");
		}
		return (chanceForRegularQuality, chanceForSilverQuality, chanceForGoldQuality, chanceForIridiumQuality);
	
	}
	public static (double chanceForRegularQuality,double chanceForSilverQuality,double chanceForGoldQuality,double chanceForIridiumQuality) Predict(int farmingLevel, int fertilizerQualityLevel, Boolean output)
	{
		//Random r2 = Utility.CreateRandom((double)xTile * 7.0, (double)yTile * 11.0, Game1.stats.DaysPlayed, Game1.uniqueIDForThisGame);
		Random r2 = new Random(); //whats the max number usable here
		
		double chanceForRegularQuality 	= 0;
		double chanceForGoldQuality 	= 0.2 * ((double)farmingLevel / 10.0) + 0.2 * (double)fertilizerQualityLevel * (((double)farmingLevel + 2.0) / 12.0) + 0.01;
		double chanceForSilverQuality 	= Math.Min(0.75, chanceForGoldQuality * 2.0);
		double chanceForIridiumQuality 	= 0;
		
		if(fertilizerQualityLevel < 3){
			chanceForRegularQuality = 1 - (chanceForSilverQuality + chanceForGoldQuality);
		}
		if(fertilizerQualityLevel >= 3){
			chanceForIridiumQuality = chanceForGoldQuality / 2.0;
		}
		
		//TEST LOG OUTPUT
	/*	Console.WriteLine("RandomNumber:\t\t{0}",r2.NextDouble());
		Console.WriteLine("chanceForRegularQuality:\t{0}",chanceForRegularQuality);
		Console.WriteLine("chanceForSilverQuality:\t{0}",chanceForSilverQuality);
		Console.WriteLine("chanceForGoldQuality:\t{0}",chanceForGoldQuality);
		Console.WriteLine("chanceForIridiumQuality:\t\t{0}",chanceForIridiumQuality);
	*/	
		
		/* Code by ConcernedApe */
		
		//Regular
		int cropQuality = 0;
		if (fertilizerQualityLevel >= 3 && r2.NextDouble() < chanceForGoldQuality / 2.0)
		{
			//iridium
			cropQuality = 4;
		}
		else if (r2.NextDouble() < chanceForGoldQuality)
		{
			//Gold
			cropQuality = 2;
		}
		else if (r2.NextDouble() < chanceForSilverQuality || fertilizerQualityLevel >= 3)
		{
			//Silver
			cropQuality = 1;
		}
		/* Code by ConcernedApe END */
		
		int minQuailty = 0;
		int maxQuailty = 3;
		if (fertilizerQualityLevel >= 3){
			minQuailty = 1;
		 	maxQuailty = 4;
		}
		cropQuality = Clamp(cropQuality, minQuailty, maxQuailty);
		// Console.WriteLine("cropQuality_clamp:\t{0}\n",cropQuality);
		
		if(output){
			Console.WriteLine("~*~*~Predicted Crop Quality~*~*~\n");
			Console.WriteLine("FarmingLevel:\t\t{0}",farmingLevel);
			Console.WriteLine("FertilizerLevel:\t{0}",fertilizerQualityLevel);
			switch(cropQuality){
				case 0:
					Console.WriteLine("Crop Quality:\t\tRegular\n");
					break;
				case 1:
					Console.WriteLine("Crop Quality:\t\tSilver\n");
					break;
				case 2:
					Console.WriteLine("Crop Quality:\t\tGold\n");
					break;
				case 3:
					Console.WriteLine("Crop Quality:\t\t??\n");
					break;
				case 4:
					Console.WriteLine("Crop Quality:\t\tIridium\n");
					break;
			}	
			Console.WriteLine("~~~~~~~~~~~~~~~~~\n\n");
		}
		return (chanceForRegularQuality, chanceForSilverQuality, chanceForGoldQuality, chanceForIridiumQuality);
	}
	
	public static (double probabilityIridiumWillOccur, double probabilityGoldWillOccur,double probabilitySilverWillOccur,double probabilityRegularWillOccur)  Probability(int farmingLevel, int fertilizerQualityLevel, Boolean outputPrediction, Boolean outputOneResultProbability){
		var rate = Predict(farmingLevel,fertilizerQualityLevel,outputPrediction);
		
		double probabilityIridiumWillOccur 	= rate.chanceForIridiumQuality;
		double probabilityIridiumWillNot	= 1 - probabilityIridiumWillOccur;
		
		double probabilityGoldWillOccur = (fertilizerQualityLevel >= 3) ? rate.chanceForGoldQuality * probabilityIridiumWillNot : rate.chanceForGoldQuality;
		double probabilityGoldWillNot 	= 1 - rate.chanceForGoldQuality;
		
		double probabilitySilverWillOccur 	= probabilityGoldWillNot * rate.chanceForSilverQuality;
		double probabilitySilverWillNot	 	= 1 - rate.chanceForSilverQuality;
		if(fertilizerQualityLevel >= 3){
			probabilitySilverWillOccur = (probabilityGoldWillNot * probabilityIridiumWillNot < 0) ? 0 : probabilityGoldWillNot * probabilityIridiumWillNot;
		}
		
		double probabilityRegularWillOccur = (fertilizerQualityLevel < 3) ? probabilityGoldWillNot * probabilitySilverWillNot : (double)0;
		
		//OUTPUT One Result Probability
		if(outputOneResultProbability){
			Console.WriteLine("~*~*~Probability of Crop Quality~*~*~\n");

			Console.WriteLine("Farming Level:\t\t{0}",farmingLevel);
			Console.WriteLine("Fertilizer Level:\t{0}\n",fertilizerQualityLevel);

			Console.WriteLine("Iridium:\t{0:F}%",probabilityIridiumWillOccur*100);
			Console.WriteLine("Gold:\t\t{0:F}%",probabilityGoldWillOccur*100);
			Console.WriteLine("Silver:\t{0:F}%",probabilitySilverWillOccur*100);
			Console.WriteLine("Regular:\t{0:F}%",probabilityRegularWillOccur*100);
			Console.WriteLine("~~~~~~~~~~~~~~~~~\n\n");
		}
		
		return(probabilityIridiumWillOccur, probabilityGoldWillOccur, probabilitySilverWillOccur, probabilityRegularWillOccur);
		
	}
	
	public static void CSVProbability(int farmingLevel, int fertilizerQualityLevel){
	
		for (int quality=0; quality < 4; quality++){
			switch(quality){
				case 0:
					Console.WriteLine("Nomral Dirt");
					Console.WriteLine("Farming Level,Regular,Silver,Gold");
					break;
				case 1:
					Console.WriteLine("\nBasic Fertilizer");
					Console.WriteLine("Farming Level,Regular,Silver,Gold");
					break;
				case 2:
					Console.WriteLine("\nQuality Fertilizer");
					Console.WriteLine("Farming Level,Regular,Silver,Gold");
					break;
				case 3:
					Console.WriteLine("\nDeluxe Fertilizer");
					Console.WriteLine("Farming Level,Silver,Gold,Iridium");
					break;
			}
			for (int farmLevel = 0; farmLevel < 15; farmLevel++){
				var result = Probability(farmLevel,quality,false,false);
				if(quality < 3){
					Console.WriteLine("{0},{1},{2},{3}",farmLevel, result.probabilityRegularWillOccur, result.probabilitySilverWillOccur, result.probabilityGoldWillOccur);
				}else{
					Console.WriteLine("{0},{1},{2},{3}",farmLevel, result.probabilitySilverWillOccur, result.probabilityGoldWillOccur, result.probabilityIridiumWillOccur);
				}
			}
		}
	}
	
	public static void Main()
	{
		int farmingLevel 					= 11;
		int fertilizerQualityLevel 			= 3;
		//int foragingLevel 					= 0;
		Boolean isBotnist					= false;
		Boolean outputPrediction 			= false;
		//Boolean outputOneResultProbability 	= true;
		Boolean outputProbabilityCSV 		= false;

		//Probability(farmingLevel,fertilizerQualityLevel,outputPrediction,outputOneResultProbability);
		for(int i=0;i<16;i++){
			PredictForage(i,isBotnist,outputPrediction);
		}
		
		if(outputProbabilityCSV){
			CSVProbability(farmingLevel, fertilizerQualityLevel);
		}
	 }
}