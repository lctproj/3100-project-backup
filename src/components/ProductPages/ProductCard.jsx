import { Link } from 'react-router-dom'

import { colors } from '../../styles/palette'

import Title from "../../assets/Title"
import StarRatings from './StarRatings'

export default function ProductCard(props) {
  const {
    img,
    name, 
    company, 
    rating, 
    ratingCount,
    price,
    itemId,
    currency='USD'
  } = props

  // TODO: Debt, can be cleared up if currency formatting is required
  let dollarFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });

  return (
    <Link to={`/product/${itemId}`} style={{ textDecoration: 'none' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        background: colors.backgroundPink,
        border: `1px solid ${colors.borderGrey}`,
        padding: 12
        }}>
        <div style={{ 
          width: 300, 
          height: 300, 
          backgroundImage: `url(${img})`, 
          backgroundSize: 'contain', 
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }} />
        <div style={{ marginTop: 8 }}>
          <Title value={name} />
        </div>
        <Title value={company} fontSize='16px' />
        <div style={{ display: 'flex', gap: 4 }}>
          <StarRatings rating={rating !== 0 && ratingCount !== 0 ? rating / ratingCount : 0} />
          ({ratingCount})
        </div>
        <div style={{ marginTop: 8 }}>
          <Title value={dollarFormatter.format(price)} />
        </div>
      </div>
    </Link>
  )
}
