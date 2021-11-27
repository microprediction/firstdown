import pandas as pd
df = pd.read_csv('https://raw.githubusercontent.com/microprediction/nflMarkov/master/inputData/pbp_nfldb_2009_2013.csv')
import matplotlib.pyplot as plt

font = {'family' : 'normal',
        'weight' : 'normal',
        'size'   : 18}
import matplotlib
matplotlib.rc('font', **font)

gains_on_first = df.loc[(df['dwn']==1)& (df['ytg']==5) & (df['type']=='PASS') & (df['yds']<8) & (df['yds']>1),:]
gains_on_first[['yds']].rename(columns={'yds':'First Down Yards Gained'}).hist(bins=50)
import matplotlib.pyplot as plt
plt.ylabel('Count',fontsize=25)
plt.xlabel('Yards on first down',fontsize=25)
plt.title('First and five passing',fontsize=30)
plt.savefig('first_and_five_passing_1200.png', dpi=1200)