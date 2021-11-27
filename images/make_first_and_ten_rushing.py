import pandas as pd
df = pd.read_csv('https://raw.githubusercontent.com/microprediction/nflMarkov/master/inputData/pbp_nfldb_2009_2013.csv')
import matplotlib.pyplot as plt

font = {'family' : 'normal',
        'weight' : 'normal',
        'size'   : 18}
import matplotlib
matplotlib.rc('font', **font)

gains_on_first = df.loc[(df['dwn']==1)& (df['ytg']==10) & (df['type']=='RUSH') & (df['yds']<15) & (df['yds']>5),:]
gains_on_first[['yds']].rename(columns={'yds':'First Down Yards Gained'}).hist(bins=50)
import matplotlib.pyplot as plt

circle = plt.Circle((0.5, 0.5), 0.2, color='yellow')

plt.ylabel('Count',fontsize=25)
plt.xlabel('Yards on first down',fontsize=25)
plt.title('First and ten rushing',fontsize=30)
plt.show()
plt.savefig('first_and_ten_rushing_1200.png', dpi=1200)



