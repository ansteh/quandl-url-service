import pandas as pd
import numpy as np
import json

import matplotlib
import matplotlib.pyplot as p

import resources

dates, dataset = resources.get_data('resources/aggregation/SP500/close.json')

column_non_zeros = np.apply_along_axis(np.count_nonzero, 0, dataset)
closes = np.sum(dataset, axis=0)/column_non_zeros

df = pd.DataFrame({ 'date' : dates, 'close' : closes })
df.plot(x='date', y='close')

df = pd.DataFrame({ 'date' : dates, 'count' : column_non_zeros })
df.plot(x='date', y='count')

p.show()
