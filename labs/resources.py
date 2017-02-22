import pandas as pd
import numpy as np
import json

def get_data(filename):
    with open(filename) as data_file:
        # print(ps.read_json(content, orient='values'))
        data = json.load(data_file)
        dates = pd.to_datetime(data['dates'], format="%Y-%m-%d")
        dataset = np.array(data['dataset'], dtype=np.float16)
        # print(dates.shape)
        # print(dataset[0][0])

        return dates, dataset
