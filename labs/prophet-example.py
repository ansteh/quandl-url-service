import pandas as pd
import numpy as np
from fbprophet import Prophet

import resources

dates, dataset = resources.get_data('resources/aggregation/SP500/close.json')

d = { 'ds': dates, 'y': dataset[0] }
df = DataFrame(data=d, index=index)

m = Prophet()
m.fit(df)

future = m.make_future_dataframe(periods=365)
future.tail()
