using System;

// https://dotnetfiddle.net/ Playground
					
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
	
	public static (double chanceForRegularQuality,double chanceForSilverQuality,double chanceForGoldQuality,double chanceForIridiumQuality) Predict(int farmingLevel, int fertilizerQualityLevel)
	{
		//Random r2 = Utility.CreateRandom((double)xTile * 7.0, (double)yTile * 11.0, Game1.stats.DaysPlayed, Game1.uniqueIDForThisGame);
		Random r2 					= new Random(); //whats the max number usable here
		
		double chanceForRegularQuality = 0;
		double chanceForGoldQuality = 0.2 * ((double)farmingLevel / 10.0) + 0.2 * (double)fertilizerQualityLevel * (((double)farmingLevel + 2.0) / 12.0) + 0.01;
		double chanceForSilverQuality = Math.Min(0.75, chanceForGoldQuality * 2.0);
		double chanceForIridiumQuality = 0;
		
		if(fertilizerQualityLevel < 3){
			chanceForRegularQuality = 1 - (chanceForSilverQuality + chanceForGoldQuality);
		}
		if(fertilizerQualityLevel >= 3){
			chanceForIridiumQuality = chanceForGoldQuality / 2.0;
		}
		
		/* Code by ConcernedApe */
		
		//Regular
		int cropQuality = 0;
		if (fertilizerQualityLevel >= 3 && r2.NextDouble() < chanceForGoldQuality / 2.0)
		{
			//iridium
			cropQuality = 4;
			//Console.WriteLine("Crop Quailty: {0}: Iridium",cropQuality);
		}
		else if (r2.NextDouble() < chanceForGoldQuality)
		{
			//Gold
			cropQuality = 2;
			//Console.WriteLine("Crop Quailty: {0}: Gold",cropQuality);
		}
		else if (r2.NextDouble() < chanceForSilverQuality || fertilizerQualityLevel >= 3)
		{
			//Silver
			cropQuality = 1;
			//Console.WriteLine("Crop Quailty: {0}: Silver",cropQuality);
		}
		/* Code by ConcernedApe END */
		else {
			//Regular
			cropQuality = 0;
			//Console.WriteLine("Crop Quailty: {0}: Regular",cropQuality);
		}
		
		int minQuailty = 0;
		int maxQuailty = 3;
		if (fertilizerQualityLevel >= 3){
			minQuailty = 1;
		 	maxQuailty = 4;
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
		cropQuality = Clamp(cropQuality, minQuailty, maxQuailty);
		//Console.WriteLine("minQuailty: {0}",minQuailty);
		//Console.WriteLine("maxQuailty: {0}",maxQuailty);
		
		/*switch(cropQuality){
			case 0:
				Console.WriteLine("Clamp: {0}: Regular",cropQuality);
				break;
			case 1:
				Console.WriteLine("Clamp: {0}: Silver",cropQuality);
				break;
			case 2:
				Console.WriteLine("Clamp: {0}: Gold",cropQuality);
				break;
			case 3:
				Console.WriteLine("Clamp: {0}: ??",cropQuality);
				break;
			case 4:
				Console.WriteLine("Clamp: {0}: Iridium",cropQuality);
				break;
		}	*/
		return (chanceForRegularQuality, chanceForSilverQuality, chanceForGoldQuality, chanceForIridiumQuality);
	}
	
	public static void Main()
	{
		for (int fertilizerQualityLevel=0; fertilizerQualityLevel < 4; fertilizerQualityLevel++){
			switch(fertilizerQualityLevel){
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
			for (int farmingLevel = 0; farmingLevel < 15; farmingLevel++){
				var result = Predict(farmingLevel,fertilizerQualityLevel);
				if(fertilizerQualityLevel < 3){
					Console.WriteLine("{0},{1},{2},{3}",farmingLevel, result.chanceForRegularQuality,result.chanceForSilverQuality,result.chanceForGoldQuality);
				}else{
					Console.WriteLine("{0},{1},{2},{3}",farmingLevel, result.chanceForSilverQuality,result.chanceForGoldQuality, result.chanceForIridiumQuality);
				}
			}
		}
	}
}