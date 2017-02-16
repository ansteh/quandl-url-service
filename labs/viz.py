import pandas as pd
import numpy as np
import json

import matplotlib
import matplotlib.pyplot as p

def get_data(filename):
    with open(filename) as data_file:
        # print(ps.read_json(content, orient='values'))
        data = json.load(data_file)
        dates = pd.to_datetime(data['dates'], format="%Y-%m-%d")
        dataset = np.array(data['dataset'], dtype=np.float16)
        # print(dates.shape)
        # print(dataset[0][0])

        return dates, dataset

dates, dataset = get_data('resources/aggregation/SP500/close.json')

column_non_zeros = np.apply_along_axis(np.count_nonzero, 0, dataset)
closes = np.sum(dataset, axis=0)/column_non_zeros

df = pd.DataFrame({ 'date' : dates, 'close' : closes })
df.plot(x='date', y='close')

df = pd.DataFrame({ 'date' : dates, 'count' : column_non_zeros })
df.plot(x='date', y='count')

p.show()
