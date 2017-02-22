import pandas as pd
import numpy as np
import json

import matplotlib
import matplotlib.pyplot as p

import resources

dates, dataset = resources.get_data('resources/aggregation/SP500/close.json')
# column_non_zeros = np.apply_along_axis(np.count_nonzero, 0, dataset)

investment = 100

for i in range(len(dates)):
    column = dataset[:,i]
    indices = np.where(column > 0.0)
    values = column[np.where(column > 0.0)]
    print(np.mean(values))
