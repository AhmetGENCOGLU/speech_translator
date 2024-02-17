import Api from '../../api';

class TranslateService {
    translate = (data) => Api.post('/t', data)
}

export { TranslateService }