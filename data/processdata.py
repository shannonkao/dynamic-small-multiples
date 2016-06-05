import csv
import json

weatherFile = open('weatherdata.csv')
weatherReader = csv.reader(weatherFile)
weatherData = list(weatherReader)

weather = []
cities = ["Detroit"]

# Dallas 5 6
# Detroit 8 9 
# SF 17 19
# Seattle 23 24

for i in range(0, len(weatherData)):    
    for c in cities:
        if len(weatherData[i]) > 6:
            pt = {  'city': c, 
                    'date': weatherData[i][0], 
                    'temp_max': weatherData[i][8],
                    'temp_min': weatherData[i][9]
                }

            weather.append(pt)
with open('weatherdata_detroit.json', 'w') as file:
    json.dump(weather, file)
    

# gameFile = open('gamedata.csv')
# gameReader = csv.reader(gameFile)
# gameData = list(gameReader)

# games = []
# teams = ["PIT", "COL", "LAK", "EDM"]

# for i in range(0, len(gameData)):    
    # for t in teams:
        # game = {'team': t, 'date': gameData[i][10], 'season': gameData[i][1]}
        # # away
        # if gameData[i][6] == t:
            # game['corsi'] = gameData[i][15]
            # games.append(game)
        # # home
        # if gameData[i][7] == t:
            # game['corsi'] = gameData[i][16]
            # games.append(game)
            
# with open('gamedata.json', 'w') as file:
    # json.dump(games, file)